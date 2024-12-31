import { FlatBoard, LayeredBoard, emptyTile, unsqueezeBoard } from "./board";
import Queue from "./Queue";
import { PositionSet } from "./Set";
import { Direction, Level, OneWayTile, SimpleTile, TileType } from "./types";

export enum SoundEvent {
  MOVE,
  EXPLOSION,
  PUSH,
  FILL,
  DOOR,
  COLLECT,
}

export interface Position {
  x: number,
  y: number,
}

export interface Game {
  board: LayeredBoard,
  player: Position,
  maxCoins: number, // The number of coins needed to complete the level.
  coins: number,
  keys: number,
  won: boolean, // Whether the curren run of the level has been completed.
  soundEvent?: SoundEvent,
  moveHistory: Direction[],
}

// Deep copy of a game object.
function cloneGameObj(game: Game): Game {
  return {
    ...game,
    board: game.board.clone(),
    player: { y: game.player.y, x: game.player.x },
    moveHistory: [...game.moveHistory],
  }
}

/**
 * Can the player walk on the given tile. By default this includes empty
 * tiles and the flag if win conditions are met. Extra adds to walkable tiles.
 * Direction should be provided if extra contains oneway tiles, otherwise any direction
 * of oneway can be walked on.
 */
export function canWalkTile(yPos: number, xPos: number, game: Game, extra?: TileType[], direction?: Direction) {
  if (game.board.inBounds(yPos, xPos)) {
    let walkable = [TileType.EMPTY, TileType.SPAWN, TileType.LITTLE_EXPLOSION, TileType.EXPLOSION];
    if (extra) walkable = walkable.concat(extra);

    const targetSpace = game.board.getLayer(yPos, xPos);
    if (targetSpace.foreground.id === TileType.FLAG && game.coins === game.maxCoins) {
      return true; // We can only walk on the flag if we have all the coins!
    }

    let canWalk = walkable.includes(targetSpace.foreground.id) && walkable.includes(targetSpace.background.id);
    if (
      canWalk &&
      direction !== undefined &&
      targetSpace.background.id === TileType.ONEWAY &&
      !canWalkOneWay(direction, targetSpace.background)
    ) {
      canWalk = false;
    }
    return canWalk;
  }

  return false; // If it is outside the board, the player can't walk there.
}

export function canWalkOneWay(direction: Direction, tile: OneWayTile) {
  if (direction === Direction.UP && tile.orientation === Direction.DOWN) return false;
  if (direction === Direction.DOWN && tile.orientation === Direction.UP) return false;
  if (direction === Direction.LEFT && tile.orientation === Direction.RIGHT) return false;
  if (direction === Direction.RIGHT && tile.orientation === Direction.LEFT) return false;

  return true;
}

/**
 * Returns the player spawn position in the given level.
 * @param {LayeredBoard} board The board[][] you wish to search. 
 * @returns {Position} Returns a position of the form {y: number, x: number}
 */
export function getSpawnPosition(board: FlatBoard | LayeredBoard): Position {
  for (let i = 0; i < board.height; i++) {
    for (let j = 0; j < board.width; j++) {
      if (board.getTile(i, j).id === TileType.SPAWN) {
        return { y: i, x: j };
      }
    }
  }

  return { y: NaN, x: NaN };
}

/**
 * Returns the number of time some value shows up in an array.
 */
export function countInstancesInBoard(board: FlatBoard | LayeredBoard, target: TileType) {
  let count = 0;

  for (let i = 0; i < board.height; i++) {
    for (let j = 0; j < board.width; j++) {
      if (board.getTile(i, j).id === target) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Checks if the destination position can be reached from the current position
 * walking only on empty spaces or the flag if enough coins have been collected. 
 * If there is no such path, returns false. If there is, returns a list of step
 * instructions for reaching the destination.
 * 
 * @returns A path to the destination position, or null if there is no valid path.
 */
export function canMoveTo(game: Game, tileX: number, tileY: number): Direction[] | null {
  if (!canWalkTile(tileY, tileX, game, [TileType.COIN, TileType.KEY, TileType.ONEWAY])) {
    return null;
  }

  interface SearchNode {
    x: number,
    y: number,
    path: Direction[],
  }

  const visited = new PositionSet(game.board.width);
  const queue = new Queue<SearchNode>();
  queue.enqueue({ x: game.player.x, y: game.player.y, path: [] });

  while (!queue.isEmpty) {
    const current = queue.dequeue();

    if (visited.has(current)) {
      // If we have visited this state, go next.
      continue;
    }

    const walkable = [TileType.COIN, TileType.KEY, TileType.ONEWAY];
    const direction = current.path.length > 0 ? current.path[current.path.length - 1] : undefined;

    if (!canWalkTile(current.y, current.x, game, walkable, direction)) {
      // If we enqueued a tile to search which we cannot walk, go next.
      continue;
    }

    // We only mark tiles as visited after checking if we can walk on them,
    // because whether or not we can walk on a tile depends on the direction
    // we attempt to walk onto it from.
    visited.add(current);

    if (tileX === current.x && tileY === current.y) {
      return current.path; // Success!
    }

    queue.enqueue({
      x: current.x + 1, y: current.y,
      path: current.path.concat(Direction.RIGHT),
    });
    queue.enqueue({
      x: current.x - 1, y: current.y,
      path: current.path.concat(Direction.LEFT),
    });
    queue.enqueue({
      x: current.x, y: current.y + 1,
      path: current.path.concat(Direction.DOWN),
    });
    queue.enqueue({
      x: current.x, y: current.y - 1,
      path: current.path.concat(Direction.UP),
    });
  }

  return null;
}

const crateTile: SimpleTile = { id: TileType.CRATE };
const explosionTile: SimpleTile = { id: TileType.EXPLOSION };
const littleExplosion: SimpleTile = { id: TileType.LITTLE_EXPLOSION };

/**
 * Attempts to do a move, return the successor state. If the move
 * is invalid, successor state may be identical to current state,
 * and the second item in the tuple is a boolean representing whether
 * the state changed.
 */
export function doGameMove(game: Game, move: Direction): [Game, boolean] {
  const next = cloneGameObj(game); // The next game object following this game move.
  const moveTo = { y: game.player.y, x: game.player.x }; // Where the player is attempting to move.
  const oneFurther = { y: game.player.y, x: game.player.x }; // One tile further that that in the same direction.

  if (move === Direction.UP) {
    moveTo.y -= 1;
    oneFurther.y -= 2;
  } else if (move === Direction.DOWN) {
    moveTo.y += 1;
    oneFurther.y += 2;
  } else if (move === Direction.LEFT) {
    moveTo.x -= 1;
    oneFurther.x -= 2;
  } else if (move === Direction.RIGHT) {
    moveTo.x += 1;
    oneFurther.x += 2;
  }

  next.soundEvent = undefined; // Clear the previous sound event.
  if (!next.board.inBounds(moveTo.y, moveTo.x)) {
    // The user attempted to move outside the board.
    return [game, false];
  }

  // Clear explosion tiles.
  const dimensions = [next.board.height, next.board.width];
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (
        next.board.getTile(i, j).id === TileType.EXPLOSION ||
        next.board.getTile(i, j).id === TileType.LITTLE_EXPLOSION
      ) {
        next.board.setTile(i, j, emptyTile);
      }
    }
  }

  // The basic structure of how this section works is that if the moveTo position is
  // on some tile that could be walked on after some game logic (e.g. a coin tile or 
  // door when keys > 0) then we do that logic and clear the tile. At the end of all the
  // logic, we run attemptMove which only succeeds and moves the player if moveTo is now
  // empty (e.g. the coin tile was collected & cleared or the door was opened & cleared)

  const moveToLayer = next.board.getLayer(moveTo.y, moveTo.x);
  const oneFurtherLayer = next.board.getLayer(oneFurther.y, oneFurther.x, true);

  // If we walked onto a collectable, add it to the inventory
  // and clear the tile on the new board object.
  if (moveToLayer.foreground.id === TileType.COIN) {
    next.coins += 1;
    next.board.setTile(moveTo.y, moveTo.x, emptyTile);
    next.soundEvent = SoundEvent.COLLECT;
  }
  if (moveToLayer.foreground.id === TileType.KEY) {
    next.keys += 1;
    next.board.setTile(moveTo.y, moveTo.x, emptyTile);
    next.soundEvent = SoundEvent.COLLECT;
  }

  // If we walked into a door and have the means to open it, do so.
  if (game.keys > 0 && moveToLayer.foreground.id === TileType.DOOR) {
    next.keys -= 1;
    next.board.setTile(moveTo.y, moveTo.x, emptyTile);
    next.soundEvent = SoundEvent.DOOR;
  }

  if (
    oneFurtherLayer.background.id === TileType.EMPTY ||
    (oneFurtherLayer.background.id === TileType.ONEWAY && canWalkOneWay(move, oneFurtherLayer.background))
  ) {
    // Pushing a crate onto an empty tile.
    if (moveToLayer.foreground.id === TileType.CRATE && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
      next.board.setTile(oneFurther.y, oneFurther.x, crateTile);
      next.soundEvent = SoundEvent.PUSH;
    }

    // Pushing a crate into a crater.
    if (moveToLayer.foreground.id === TileType.CRATE && oneFurtherLayer.foreground.id === TileType.CRATER) {
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
      next.board.setTile(oneFurther.y, oneFurther.x, emptyTile);
      next.soundEvent = SoundEvent.FILL;
    }

    // Pushing a bomb onto an empty tile.
    if (moveToLayer.foreground.id === TileType.BOMB && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      next.board.setTile(oneFurther.y, oneFurther.x, moveToLayer.foreground);
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
      next.soundEvent = SoundEvent.PUSH;
    }
  }

  const moved = attemptMove(moveTo.y, moveTo.x, next, move);
  if (!moved) return [game, false];

  // Tile entity logic handling. If we haven't moved, we shouldn't
  // decrease bomb fuse (invalid moves shouldn't count as a timestep).

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      const tile = next.board.getTile(i, j);

      if (tile.id === TileType.BOMB) {
        tile.fuse--;

        if (tile.fuse === 0) {
          if (next.board.getTile(i - 1, j, true).id === TileType.CRATE) next.board.setTile(i - 1, j, littleExplosion);
          if (next.board.getTile(i + 1, j, true).id === TileType.CRATE) next.board.setTile(i + 1, j, littleExplosion);
          if (next.board.getTile(i, j - 1, true).id === TileType.CRATE) next.board.setTile(i, j - 1, littleExplosion);
          if (next.board.getTile(i, j + 1, true).id === TileType.CRATE) next.board.setTile(i, j + 1, littleExplosion);

          next.board.setTile(i, j, explosionTile);
          next.soundEvent = SoundEvent.EXPLOSION;
        }
      }
    }
  }

  next.won = winCondition(next);
  next.moveHistory.push(move);

  if (!next.soundEvent && !next.won) {
    next.soundEvent = SoundEvent.MOVE;
  }

  return [next, true];
}

function attemptMove(yPos: number, xPos: number, next: Game, direction?: Direction) {
  if (canWalkTile(yPos, xPos, next, [TileType.ONEWAY], direction)) {
    next.player.x = xPos;
    next.player.y = yPos;
    return true;
  }
  return false;
}

function winCondition(next: Game) {
  return next.board.getTile(next.player.y, next.player.x).id === TileType.FLAG && (next.coins === next.maxCoins);
}

/**
 * Creates a new game object for the given level.
 * @returns A Game object properly set up for game start.
 */
export function initializeGameObj(level: Level): Game {
  const board = new LayeredBoard(unsqueezeBoard(level.board));
  const startPos = getSpawnPosition(board);
  board.setTile(startPos.y, startPos.x, emptyTile);

  const numberOfCoins = countInstancesInBoard(board, TileType.COIN);
  return {
    board: board,
    player: startPos,
    maxCoins: numberOfCoins,
    coins: 0,
    keys: 0,
    won: false,
    moveHistory: [],
  };
}