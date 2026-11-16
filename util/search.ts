import type { Game } from "./logic";
import { BombTile, Direction, OneWayTile, TileType } from "./types";

/**
 * Level solver. A* where cost is the number of moves, so with weight 1 the first
 * solution found is a shortest one.
 *
 * Walking over empty tiles changes nothing but the player's position (and the bomb
 * fuses), so the search never steps one tile at a time. Each edge is an interaction:
 * walk the shortest route to a tile next to something, then push it, collect it, open
 * it or finish on it. While bombs are ticking, the edges are found per time window
 * between explosions, so waiting for a bomb is part of the walk. The actual move list
 * is rebuilt for the final path only.
 *
 * A state is packed into a byte per tile (foreground only; backgrounds never change),
 * with bomb fuses in the same byte (BOMB_BASE + fuse). The move rules reimplement
 * doGameMove on that packed form; callers can replay a solution through doGameMove.
 */

export interface SolveOptions {
  maxNodes?: number, // Give up after expanding this many states.
  timeLimitMs?: number,
  // Heuristic weight. 1 finds a shortest solution; w > 1 is faster and finds one at
  // most w times longer than the shortest.
  weight?: number,
  // Steer by a rougher estimate that counts obstacles (crates, craters, locked doors).
  // Much faster on crowded levels, but solutions are no longer guaranteed shortest.
  rough?: boolean,
}

export interface SolveResult {
  solution: Direction[] | null,
  expanded: number,
  generated: number,
  ms: number,
  exhausted: boolean, // True if the search proved there is no solution.
}

// Packed foreground codes. These match TileType where possible.
const EMPTY = TileType.EMPTY;
const DOOR = TileType.DOOR;
const KEY = TileType.KEY;
const CRATE = TileType.CRATE;
const CRATER = TileType.CRATER;
const COIN = TileType.COIN;
const FLAG = TileType.FLAG;
const METAL = TileType.METAL_CRATE;
const ICE = TileType.ICE_BLOCK;
const SOLID = 15; // Anything the player can neither enter nor push (e.g. diamonds).
const BOMB_BASE = 16; // A bomb is BOMB_BASE + fuse. Fuse 0 never explodes.

const DX = [0, 1, 0, -1]; // Indexed by Direction: UP, RIGHT, DOWN, LEFT.
const DY = [-1, 0, 1, 0];
const INF = 1 << 20;

/** Doubling typed array storage. */
function grow<T extends Uint8Array | Uint16Array | Int32Array | Float64Array>(array: T, needed: number): T {
  if (needed <= array.length) return array;
  let size = array.length;
  while (size < needed) size *= 2;
  const next = new (array.constructor as any)(size) as T;
  next.set(array);
  return next;
}

export function solve(game: Game, options: SolveOptions = {}): SolveResult {
  const start = Date.now();
  const maxNodes = options.maxNodes ?? 2_000_000;
  const timeLimit = options.timeLimitMs ?? Infinity;
  // f = g + weight * h, scaled to integers for the bucket queue.
  const hScale = Math.round((options.weight ?? 1) * 4);
  const gScale = 4;

  const { board } = game;
  const W = board.width;
  const H = board.height;
  const N = W * H;

  // Static background: canEnter[d * N + i] says whether something moving in
  // direction d may enter tile i (walls and one-way tiles never move).
  const canEnter = new Uint8Array(4 * N);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const background = board.getBackground(y, x);
      for (let d = 0; d < 4; d++) {
        let ok = background.id === TileType.EMPTY;
        if (background.id === TileType.ONEWAY) {
          const opposite = (d + 2) % 4; // Moving UP enters through the DOWN side.
          ok = !(background as OneWayTile).blocked.includes(opposite);
        }
        canEnter[d * N + y * W + x] = ok ? 1 : 0;
      }
    }
  }

  // neighbor[d * N + i] is the tile one step from i in direction d, or -1 off the board.
  const neighbor = new Int32Array(4 * N);
  for (let i = 0; i < N; i++) {
    const x = i % W, y = (i / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d], ny = y + DY[d];
      neighbor[d * N + i] = nx >= 0 && nx < W && ny >= 0 && ny < H ? ny * W + nx : -1;
    }
  }

  // All pairs shortest walking distances on the empty level (walls and one-ways only).
  // Ignoring every foreground tile makes these a lower bound on real distances.
  const dist = new Int32Array(N * N).fill(INF);
  const queue = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    const row = s * N;
    dist[row + s] = 0;
    let head = 0, tail = 0;
    queue[tail++] = s;
    while (head < tail) {
      const i = queue[head++];
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || !canEnter[d * N + j] || dist[row + j] !== INF) continue;
        dist[row + j] = dist[row + i] + 1;
        queue[tail++] = j;
      }
    }
  }

  // Initial packed state.
  const initial = new Uint8Array(N);
  let flag = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tile = board.getTile(y, x);
      const i = y * W + x;
      let code: number;
      switch (tile.id) {
        case TileType.EMPTY: case TileType.SPAWN: case TileType.EXPLOSION: case TileType.LITTLE_EXPLOSION:
          code = EMPTY; break;
        case TileType.DOOR: case TileType.KEY: case TileType.CRATE: case TileType.CRATER:
        case TileType.COIN: case TileType.FLAG: case TileType.METAL_CRATE: case TileType.ICE_BLOCK:
          code = tile.id; break;
        case TileType.BOMB: {
          const fuse = (tile as BombTile).fuse;
          if (fuse > 255 - BOMB_BASE) throw new Error("Bomb fuse too long for the solver.");
          code = BOMB_BASE + Math.max(0, fuse);
          break;
        }
        default:
          code = SOLID;
      }
      if (code === FLAG) flag = i;
      initial[i] = code;
    }
  }

  // Search entries: one per generated state, holding only the edge that produced it.
  // Boards are stored only for expanded states (slot), and rebuilt from the parent then.
  let entParent = new Int32Array(4096);
  let entMove = new Uint8Array(4096); // Direction of the final step.
  let entPlayer = new Uint16Array(4096);
  let entCost = new Uint16Array(4096);
  let entKeys = new Uint8Array(4096);
  let entSlot = new Int32Array(4096);
  let entHash = new Float64Array(4096);
  let entries = 0;
  let pool = new Uint8Array(N * 1024); // Boards of expanded states.
  let slots = 0;

  const newEntry = () => {
    const id = entries++;
    if (id >= entParent.length) {
      entParent = grow(entParent, id + 1);
      entMove = grow(entMove, id + 1);
      entPlayer = grow(entPlayer, id + 1);
      entCost = grow(entCost, id + 1);
      entKeys = grow(entKeys, id + 1);
      entSlot = grow(entSlot, id + 1);
      entHash = grow(entHash, id + 1);
    }
    return id;
  };

  // Open addressing table from state hash to the best cost found for it.
  let tableKeys = new Float64Array(1 << 16);
  let tableCost = new Uint16Array(1 << 16);
  let tableSize = 0;
  const tableFind = (hash: number) => {
    const mask = tableKeys.length - 1;
    let i = (hash % 4294967296) & mask; // Low bits of the hash.
    while (tableKeys[i] !== 0 && tableKeys[i] !== hash) i = (i + 1) & mask;
    return i;
  };
  const tableSet = (hash: number, value: number) => {
    let i = tableFind(hash);
    if (tableKeys[i] === 0) {
      if (++tableSize * 2 > tableKeys.length) {
        const oldKeys = tableKeys, oldCost = tableCost;
        tableKeys = new Float64Array(oldKeys.length * 2);
        tableCost = new Uint16Array(oldKeys.length * 2);
        for (let j = 0; j < oldKeys.length; j++) {
          if (oldKeys[j] === 0) continue;
          const k = tableFind(oldKeys[j]);
          tableKeys[k] = oldKeys[j];
          tableCost[k] = oldCost[j];
        }
        i = tableFind(hash);
      }
      tableKeys[i] = hash;
    }
    tableCost[i] = value;
  };
  const tableGet = (hash: number) => {
    const i = tableFind(hash);
    return tableKeys[i] === 0 ? INF : tableCost[i];
  };

  // Bucket queue on f. Within a bucket, last in first out (prefers deeper entries).
  const buckets: number[][] = [];
  let minBucket = 0;
  const push = (entry: number, f: number) => {
    (buckets[f] ??= []).push(entry);
    if (f < minBucket) minBucket = f;
  };

  // Tiles reachable from the player on the empty level with every `blocked` tile walled off.
  const reachQueue = new Int32Array(N);
  let reachStamp = 0;
  const doorMark = new Int32Array(N), craterMark = new Int32Array(N);
  const reachAvoiding = (b: Uint8Array, o: number, player: number, blocked: number, reachMark: Int32Array) => {
    reachStamp++;
    let head = 0, tail = 0;
    reachQueue[tail++] = player;
    reachMark[player] = reachStamp;
    while (head < tail) {
      const i = reachQueue[head++];
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || reachMark[j] === reachStamp || !canEnter[d * N + j] || b[o + j] === blocked) continue;
        reachMark[j] = reachStamp;
        reachQueue[tail++] = j;
      }
    }
    return reachStamp;
  };

  /**
   * Lower bound on the moves from the player to target, at least the walking distance on
   * the empty level. If the target is walled off by doors and the player holds no key,
   * the route must pass a key first. If it's walled off by craters, the route must first
   * step onto some crate or ice (to push it). INF when that can never happen.
   */
  const gates: number[] = []; // Keys, then fillers, found on this board.
  let keyCount = 0;
  const viaGate = (player: number, target: number, from: number, to: number) => {
    let best = INF;
    for (let k = from; k < to; k++) {
      const v = dist[player * N + gates[k]] + dist[gates[k] * N + target];
      if (v < best) best = v;
    }
    return best;
  };

  const coins: number[] = [];
  const coinBound: number[] = [];
  const heuristic = (b: Uint8Array, o: number, player: number, keys: number) => {
    coins.length = 0;
    gates.length = 0;
    let doors = 0, craters = 0;
    for (let i = 0; i < N; i++) {
      const c = b[o + i];
      if (c === COIN) coins.push(i);
      else if (c === KEY) gates.push(i);
      else if (c === DOOR) doors++;
      else if (c === CRATER) craters++;
    }
    keyCount = gates.length;
    if (craters > 0) for (let i = 0; i < N; i++) if (b[o + i] === CRATE || b[o + i] === ICE) gates.push(i);

    const doorStamp = doors > 0 && keys === 0 ? reachAvoiding(b, o, player, DOOR, doorMark) : -1;
    const craterStamp = craters > 0 ? reachAvoiding(b, o, player, CRATER, craterMark) : -1;
    const bound = (target: number) => {
      let v = dist[player * N + target];
      if (doorStamp >= 0 && doorMark[target] !== doorStamp) {
        const viaKey = viaGate(player, target, 0, keyCount);
        if (viaKey > v) v = viaKey;
      }
      if (craterStamp >= 0 && craterMark[target] !== craterStamp) {
        const viaFiller = viaGate(player, target, keyCount, gates.length);
        if (viaFiller > v) v = viaFiller;
      }
      return v;
    };

    // The player must visit every remaining coin, then the flag.
    let best = bound(flag);
    coinBound.length = 0;
    for (let a = 0; a < coins.length; a++) coinBound.push(bound(coins[a]));
    for (let a = 0; a < coins.length; a++) {
      const ca = coins[a];
      const viaA = coinBound[a] + dist[ca * N + flag];
      if (viaA > best) best = viaA;
      for (let c = a + 1; c < coins.length; c++) {
        const cb = coins[c];
        const ab = coinBound[a] + dist[ca * N + cb] + dist[cb * N + flag];
        const ba = coinBound[c] + dist[cb * N + ca] + dist[ca * N + flag];
        const pair = ab < ba ? ab : ba;
        if (pair > best) best = pair;
      }
    }
    return best >= INF ? INF : best;
  };

  // Rough estimate for options.rough: walking distance where obstacles cost extra,
  // to the nearest coin, then a nearest-coin-next tour, then the flag, plus whatever
  // extra the obstacles add on the way to the flag.
  const roughDist = new Int32Array(N);
  const roughQueue = new Int32Array(N * 8);
  const roughQueued = new Uint8Array(N);
  const roughCoins: number[] = [];
  const fillerDist = new Int32Array(N), keyDist = new Int32Array(N);
  /** Walking distance on the empty level from every tile to the nearest `a` or `b` tile. */
  const nearest = (b: Uint8Array, o: number, a: number, c: number, out: Int32Array) => {
    out.fill(INF);
    let head = 0, tail = 0;
    for (let i = 0; i < N; i++) {
      if (b[o + i] !== a && b[o + i] !== c) continue;
      out[i] = 0;
      reachQueue[tail++] = i;
    }
    while (head < tail) {
      const i = reachQueue[head++];
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        // Reverse direction: from j you could walk into i.
        if (j < 0 || out[j] !== INF || !canEnter[d * N + j]) continue;
        out[j] = out[i] + 1;
        reachQueue[tail++] = j;
      }
    }
  };
  const roughEstimate = (b: Uint8Array, o: number, player: number, keys: number) => {
    let fillers = 0, keysLeft = 0;
    roughCoins.length = 0;
    for (let i = 0; i < N; i++) {
      const c = b[o + i];
      if (c === CRATE || c === ICE) fillers++;
      else if (c === KEY) keysLeft++;
      else if (c === COIN) roughCoins.push(i);
    }
    // Crossing a crater means fetching a crate (or ice) to it; a locked door means
    // fetching a key. Charge roughly the round trip to the nearest one.
    nearest(b, o, CRATE, ICE, fillerDist);
    if (keys === 0) nearest(b, o, KEY, KEY, keyDist);
    const enterCost = (c: number, j: number) => {
      if (c === EMPTY || c === COIN || c === KEY || c === FLAG) return 1;
      if (c === CRATE || c === ICE || c === METAL || c >= BOMB_BASE) return 3;
      if (c === CRATER) return fillers > 0 ? 1 + 2 * fillerDist[j] : INF;
      if (c === DOOR) return keys > 0 ? 1 : keysLeft > 0 ? 1 + 2 * keyDist[j] : INF;
      return INF;
    };
    roughDist.fill(INF);
    roughDist[player] = 0;
    let head = 0, tail = 0;
    roughQueue[tail++] = player;
    roughQueued[player] = 1;
    while (head !== tail) {
      const i = roughQueue[head];
      head = (head + 1) % roughQueue.length;
      roughQueued[i] = 0;
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || !canEnter[d * N + j]) continue;
        const next = roughDist[i] + enterCost(b[o + j], j);
        if (next >= roughDist[j]) continue;
        roughDist[j] = next;
        if (!roughQueued[j]) {
          roughQueued[j] = 1;
          roughQueue[tail] = j;
          tail = (tail + 1) % roughQueue.length;
        }
      }
    }
    if (roughDist[flag] >= INF) return INF;
    if (roughCoins.length === 0) return roughDist[flag];

    let at = -1, total = INF;
    for (const c of roughCoins) if (roughDist[c] < total) { total = roughDist[c]; at = c; }
    if (total >= INF) return INF;
    const left = roughCoins.filter(c => c !== at);
    while (left.length > 0) {
      let k = 0;
      for (let m = 1; m < left.length; m++) if (dist[at * N + left[m]] < dist[at * N + left[k]]) k = m;
      total += dist[at * N + left[k]];
      at = left[k];
      left.splice(k, 1);
    }
    return total + dist[at * N + flag] + (roughDist[flag] - dist[player * N + flag]);
  };

  const hashState = (b: Uint8Array, o: number, player: number, keys: number) => {
    let h1 = 0x811c9dc5 ^ player, h2 = 0x9e3779b9 ^ Math.imul(keys, 0x85ebca6b);
    for (let i = 0; i < N; i++) {
      const c = b[o + i];
      h1 = Math.imul(h1 ^ c, 0x01000193);
      h2 = Math.imul(h2 ^ c, 0x5bd1e995) ^ (h2 >>> 15);
    }
    h2 = Math.imul(h2 ^ player, 0x27d4eb2d);
    return (h1 >>> 0) * 2097152 + (h2 >>> 11) + 1; // 53 bits, never 0 (0 marks empty table slots).
  };

  /** Advance every lit bomb by `steps` moves. Callers never skip past an explosion. */
  const tick = (b: Uint8Array, o: number, steps: number) => {
    for (let i = 0; i < N; i++) {
      const c = b[o + i];
      if (c <= BOMB_BASE) continue;
      if (c - steps > BOMB_BASE) {
        b[o + i] = c - steps;
        continue;
      }
      b[o + i] = EMPTY; // Exploded; it takes adjacent crates and ice with it.
      for (let e = 0; e < 4; e++) {
        const j = neighbor[e * N + i];
        if (j >= 0 && (b[o + j] === CRATE || b[o + j] === ICE)) b[o + j] = EMPTY;
      }
    }
  };

  // Scratch for metal crate components.
  const metalStack = new Int32Array(N);
  const metalSeen = new Uint8Array(N);
  const metalList: number[] = [];
  const metalMoves = new Uint8Array(N);

  /**
   * Checks the player at `from` can move in direction d and that the move does
   * something (anything but walking onto an empty tile). Leaves metal crate scratch
   * filled in for applyInteraction.
   */
  const canInteract = (b: Uint8Array, o: number, from: number, d: number, keys: number, coinsLeft: number) => {
    const t = neighbor[d * N + from];
    if (t < 0 || !canEnter[d * N + t]) return false;
    const target = b[o + t];
    const u = neighbor[d * N + t]; // One further.
    const pushable = u >= 0 && canEnter[d * N + u] === 1;

    if (target === COIN || target === KEY) return true;
    if (target === DOOR) return keys > 0;
    if (target === FLAG) return coinsLeft === 0;
    if (target === CRATE || target === ICE) {
      if (!pushable) return false;
      const beyond = b[o + u];
      return beyond === EMPTY || beyond === CRATER;
    }
    if (target >= BOMB_BASE) return pushable && b[o + u] === EMPTY;
    if (target !== METAL || !pushable) return false;

    // Collect the connected metal crates and work out which ones move, front to back.
    metalList.length = 0;
    let top = 0;
    metalStack[top++] = t;
    metalSeen[t] = 1;
    while (top > 0) {
      const i = metalStack[--top];
      metalList.push(i);
      for (let e = 0; e < 4; e++) {
        const j = neighbor[e * N + i];
        if (j >= 0 && !metalSeen[j] && b[o + j] === METAL) {
          metalSeen[j] = 1;
          metalStack[top++] = j;
        }
      }
    }
    const along = (i: number) => d === Direction.UP ? (i / W) | 0 : d === Direction.DOWN ? -((i / W) | 0) : d === Direction.LEFT ? i % W : -(i % W);
    metalList.sort((p, q) => along(p) - along(q));
    for (const i of metalList) {
      metalMoves[i] = 0;
      const j = neighbor[d * N + i];
      if (j < 0 || !canEnter[d * N + j]) continue;
      const there = b[o + j];
      if (there === EMPTY || (there === METAL && metalSeen[j] && metalMoves[j])) metalMoves[i] = 1;
    }
    for (const i of metalList) metalSeen[i] = 0;
    return metalMoves[t] === 1; // Otherwise the crate in front of the player is stuck.
  };

  /** Applies a move canInteract just approved, in place. Returns the keys after. */
  let pushedTo = -1; // Where applyInteraction left a pushed crate or ice block, or -1.
  const applyInteraction = (b: Uint8Array, o: number, from: number, d: number, keys: number) => {
    pushedTo = -1;
    const t = neighbor[d * N + from];
    const u = neighbor[d * N + t];
    const target = b[o + t];
    if (target === COIN) {
      b[o + t] = EMPTY;
    } else if (target === KEY) {
      b[o + t] = EMPTY;
      keys++;
    } else if (target === DOOR) {
      b[o + t] = EMPTY;
      keys--;
    } else if (target === CRATE || target === ICE) {
      if (b[o + u] === CRATER) {
        b[o + u] = EMPTY; // Fill the crater.
      } else if (target === CRATE) {
        b[o + u] = CRATE;
        pushedTo = u;
      } else {
        // Ice slides until it hits something, filling the first crater it reaches.
        let prev = u, cur = u;
        let filled = false;
        while (true) {
          if (cur >= 0 && b[o + cur] === CRATER) { b[o + cur] = EMPTY; filled = true; break; }
          if (cur < 0 || b[o + cur] !== EMPTY || !canEnter[d * N + cur]) break;
          prev = cur;
          cur = neighbor[d * N + cur];
        }
        if (!filled) { b[o + prev] = ICE; pushedTo = prev; }
      }
      b[o + t] = EMPTY;
    } else if (target >= BOMB_BASE) {
      b[o + u] = target;
      b[o + t] = EMPTY;
    } else if (target === METAL) {
      for (const i of metalList) if (metalMoves[i]) b[o + i] = EMPTY;
      for (const i of metalList) if (metalMoves[i]) b[o + neighbor[d * N + i]] = METAL;
    }
    return keys;
  };


  // Walking: shortest distances over empty tiles from every tile set in `sources`.
  // Stamped to avoid clearing.
  const walkDist = new Int32Array(N);
  const walkStamp = new Int32Array(N);
  const walkOrder = new Int32Array(N);
  let stamp = 0;
  const walk = (b: Uint8Array, o: number, sources: Uint8Array, limit: number) => {
    stamp++;
    let head = 0, tail = 0;
    for (let i = 0; i < N; i++) {
      if (!sources[i]) continue;
      walkOrder[tail++] = i;
      walkStamp[i] = stamp;
      walkDist[i] = 0;
    }
    while (head < tail) {
      const i = walkOrder[head++];
      const next = walkDist[i] + 1;
      if (next > limit) continue;
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || walkStamp[j] === stamp || !canEnter[d * N + j] || b[o + j] !== EMPTY) continue;
        walkStamp[j] = stamp;
        walkDist[j] = next;
        walkOrder[tail++] = j;
      }
    }
    return tail;
  };

  /** Writes into `to` the tiles reachable with one step of walking from the tiles in `from`. */
  const stepLayer = (b: Uint8Array, o: number, from: Uint8Array, to: Uint8Array) => {
    to.fill(0);
    let any = false;
    for (let i = 0; i < N; i++) {
      if (!from[i]) continue;
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || !canEnter[d * N + j] || b[o + j] !== EMPTY) continue;
        to[j] = 1;
        any = true;
      }
    }
    return any;
  };

  // Where the player can be after exactly `steps` moves of walking from the tiles in
  // `layer` (overwritten with the answer). False if the player gets stuck.
  let layerB: Uint8Array = new Uint8Array(N), layerC: Uint8Array = new Uint8Array(N);
  const walkExactly = (b: Uint8Array, o: number, layer: Uint8Array, steps: number) => {
    let current = layer;
    layerC.fill(0); // Two layers back, to spot the period two cycle.
    for (let k = 1; k <= steps; k++) {
      if (!stepLayer(b, o, current, layerB)) return false;
      // Once a layer repeats the one two steps back, the layers alternate from then on.
      const settled = (steps - k) % 2 === 0 && layerB.every((v, i) => v === layerC[i]);
      const spare = layerC;
      layerC = current;
      current = layerB;
      layerB = spare;
      if (settled) break;
    }
    if (current !== layer) layer.set(current);
    // Keep the scratch layers distinct from the caller's.
    if (layerB === layer) layerB = new Uint8Array(N);
    if (layerC === layer) layerC = new Uint8Array(N);
    return true;
  };

  // Frozen crates: a crate (or ice block) that can never move again, because on both
  // axes it has a wall or another frozen crate on one side. With no bombs lit, frozen
  // crates are walls for good, so a state is dead if they cut the player off from a
  // coin or the flag. Oneway tiles are not counted as walls, which keeps this sound.
  const isWall = (j: number) => j < 0 || canEnter[j] + canEnter[N + j] + canEnter[2 * N + j] + canEnter[3 * N + j] === 0;
  const isBox = (c: number) => c === CRATE || c === ICE;
  const freezing = new Uint8Array(N);
  const isFrozen = (b: Uint8Array, o: number, i: number): boolean => {
    freezing[i] = 1; // Treated as a wall while its neighbors are checked.
    const blockedAlong = (d1: number, d2: number) => {
      const a = neighbor[d1 * N + i], c = neighbor[d2 * N + i];
      if (isWall(a) || isWall(c)) return true;
      return (isBox(b[o + a]) && (freezing[a] === 1 || isFrozen(b, o, a))) ||
        (isBox(b[o + c]) && (freezing[c] === 1 || isFrozen(b, o, c)));
    };
    const frozen = blockedAlong(Direction.UP, Direction.DOWN) && blockedAlong(Direction.LEFT, Direction.RIGHT);
    freezing[i] = 0;
    return frozen;
  };
  const frozenWall = new Uint8Array(N);
  const isDeadEnd = (b: Uint8Array, o: number, player: number) => {
    for (let i = 0; i < N; i++) frozenWall[i] = isBox(b[o + i]) && isFrozen(b, o, i) ? 1 : 0;
    reachStamp++;
    let head = 0, tail = 0;
    reachQueue[tail++] = player;
    doorMark[player] = reachStamp;
    while (head < tail) {
      const i = reachQueue[head++];
      for (let d = 0; d < 4; d++) {
        const j = neighbor[d * N + i];
        if (j < 0 || doorMark[j] === reachStamp || !canEnter[d * N + j] || frozenWall[j]) continue;
        doorMark[j] = reachStamp;
        reachQueue[tail++] = j;
      }
    }
    for (let i = 0; i < N; i++) {
      const c = b[o + i];
      if ((c === COIN || c === FLAG) && doorMark[i] !== reachStamp) return true;
    }
    return false;
  };

  const failure = (exhausted: boolean, expanded = 0): SolveResult =>
    ({ solution: null, expanded, generated: entries, ms: Date.now() - start, exhausted });
  if (flag < 0) return failure(true);

  const work = new Uint8Array(N); // Scratch board for generating children.
  let parentEntry = 0;
  const addChild = (move: number, player: number, keys: number, g: number) => {
    const hash = hashState(work, 0, player, keys);
    if (tableGet(hash) <= g) return;
    const won = work[player] === FLAG;
    const h = won ? 0 : heuristic(work, 0, player, keys);
    if (h >= INF) return; // A coin or the flag can never be reached.
    tableSet(hash, g);
    const e = newEntry();
    entParent[e] = parentEntry;
    entMove[e] = move;
    entPlayer[e] = player;
    entCost[e] = g;
    entKeys[e] = keys;
    entSlot[e] = -1;
    entHash[e] = hash;
    push(e, g * gScale + (options.rough ? roughEstimate(work, 0, player, keys) : h) * hScale);
  };

  /**
   * Rebuilds the board of entry e into a new slot, from its (expanded) parent: walking
   * ticks the bombs, then the final step interacts. Explosions while walking only clear
   * tiles, so ticking all the walking at once gives the same board.
   */
  const materialize = (e: number) => {
    const slot = slots++;
    pool = grow(pool, slots * N);
    const o = slot * N;
    entSlot[e] = slot;
    const p = entParent[e];
    if (p < 0) {
      pool.set(initial, o);
      return o;
    }
    const po = entSlot[p] * N;
    pool.copyWithin(o, po, po + N);
    const d = entMove[e];
    const from = neighbor[((d + 2) % 4) * N + entPlayer[e]];
    tick(pool, o, entCost[e] - entCost[p] - 1);
    canInteract(pool, o, from, d, entKeys[p], 0); // Fills metal crate scratch.
    applyInteraction(pool, o, from, d, entKeys[p]);
    tick(pool, o, 1);
    return o;
  };

  // Root entry.
  const root = newEntry();
  entParent[root] = -1;
  entPlayer[root] = game.player.y * W + game.player.x;
  entCost[root] = 0;
  entKeys[root] = game.keys;
  entHash[root] = hashState(initial, 0, entPlayer[root], game.keys);
  const rootH = heuristic(initial, 0, entPlayer[root], game.keys);
  if (rootH >= INF) return failure(true);
  tableSet(entHash[root], 0);
  push(root, (options.rough ? roughEstimate(initial, 0, entPlayer[root], game.keys) : rootH) * hScale);

  const windowBoard = new Uint8Array(N); // The board during the current time window.
  const positions = new Uint8Array(N); // Where the player may be when the window opens.
  let expanded = 0;
  let goal = -1;

  while (true) {
    while (minBucket < buckets.length && !(buckets[minBucket]?.length)) minBucket++;
    if (minBucket >= buckets.length) return failure(true, expanded);
    const e = buckets[minBucket].pop()!;
    const g = entCost[e];
    if (tableGet(entHash[e]) < g) continue; // Stale: a cheaper path to this state was found later.

    const player = entPlayer[e];
    const keys = entKeys[e];
    const o = materialize(e);
    if (pool[o + player] === FLAG) { goal = e; break; }

    expanded++;
    if (expanded > maxNodes || ((expanded & 255) === 0 && Date.now() - start > timeLimit)) {
      return failure(false, expanded);
    }

    let coinsLeft = 0;
    for (let i = 0; i < N; i++) if (pool[o + i] === COIN) coinsLeft++;
    parentEntry = e;

    // Explosions split the future into windows in which the board holds still. In each,
    // try every interaction from the earliest moment its tile can be reached, finishing
    // no later than the window's closing explosion.
    windowBoard.set(pool.subarray(o, o + N));
    positions.fill(0);
    positions[player] = 1;
    let elapsed = 0;
    while (true) {
      let length = INF;
      for (let i = 0; i < N; i++) {
        const c = windowBoard[i];
        if (c > BOMB_BASE && c - BOMB_BASE < length) length = c - BOMB_BASE;
      }

      const reached = walk(windowBoard, 0, positions, length - 1);
      for (let r = 0; r < reached; r++) {
        const from = walkOrder[r];
        const steps = walkDist[from] + 1;
        for (let d = 0; d < 4; d++) {
          if (!canInteract(windowBoard, 0, from, d, keys, coinsLeft)) continue;
          work.set(windowBoard);
          const nextKeys = applyInteraction(work, 0, from, d, keys);
          if (length < INF) tick(work, 0, steps);
          else if (pushedTo >= 0 && isFrozen(work, 0, pushedTo) && isDeadEnd(work, 0, neighbor[d * N + from])) continue;
          addChild(d, neighbor[d * N + from], nextKeys, g + elapsed + steps);
        }
      }

      if (length === INF) break; // No bombs left to wait for.
      if (!walkExactly(windowBoard, 0, positions, length)) break; // Nowhere to wait.
      tick(windowBoard, 0, length);
      elapsed += length;
    }
  }

  // Rebuild the moves along the path. Each edge walks for some steps (the board changing
  // as bombs go off) and then interacts, so search forward through time for the walk.
  const path: number[] = [];
  for (let n = goal; n !== root; n = entParent[n]) path.push(n);
  path.reverse();
  const solution: Direction[] = [];
  const replay = new Uint8Array(N);
  for (const n of path) {
    const p = entParent[n];
    replay.set(pool.subarray(entSlot[p] * N, entSlot[p] * N + N));
    const d = entMove[n];
    const to = neighbor[((d + 2) % 4) * N + entPlayer[n]];
    const length = entCost[n] - entCost[p] - 1;

    // layers[k]: where the player can be after k steps; boards[k]: the board then.
    const layers = [new Uint8Array(N)];
    const boards = [replay.slice()];
    layers[0][entPlayer[p]] = 1;
    for (let k = 1; k <= length; k++) {
      const next = new Uint8Array(N);
      stepLayer(replay, 0, layers[k - 1], next);
      tick(replay, 0, 1);
      layers.push(next);
      boards.push(replay.slice());
    }

    const steps: Direction[] = [];
    for (let k = length, i = to; k > 0; k--) {
      // Step back to a tile the player could be on a step earlier that can step here.
      for (let s = 0; s < 4; s++) {
        const j = neighbor[((s + 2) % 4) * N + i];
        if (j >= 0 && layers[k - 1][j] && canEnter[s * N + i] && boards[k - 1][i] === EMPTY) {
          steps.push(s as Direction);
          i = j;
          break;
        }
      }
    }
    solution.push(...steps.reverse(), d as Direction);
  }

  return { solution, expanded, generated: entries, ms: Date.now() - start, exhausted: false };
}
