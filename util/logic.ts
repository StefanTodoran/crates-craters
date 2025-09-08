import { emptyTile, FlatBoard, LayeredBoard, unsqueezeBoard } from "./board";
import Queue from "./Queue";
import { PositionSet } from "./Set";
import { Direction, directionToOffset, explodableTiles, fillCapableTiles, Level, Offset, OneWayTile, pushableTiles, SimpleTile, TileType } from "./types";

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
      !canEnterOneWay(direction, targetSpace.background)
    ) {
      canWalk = false;
    }
    return canWalk;
  }

  return false; // If it is outside the board, the player can't walk there.
}

export function canEnterOneWay(direction: Direction, tile: OneWayTile) {
  if (direction === Direction.UP && tile.blocked.includes(Direction.DOWN)) return false;
  if (direction === Direction.DOWN && tile.blocked.includes(Direction.UP)) return false;
  if (direction === Direction.LEFT && tile.blocked.includes(Direction.RIGHT)) return false;
  if (direction === Direction.RIGHT && tile.blocked.includes(Direction.LEFT)) return false;

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
  const { dx, dy } = directionToOffset(move);

  moveTo.x += dx;
  moveTo.y += dy;
  oneFurther.x += dx * 2;
  oneFurther.y += dy * 2;

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
    (oneFurtherLayer.background.id === TileType.ONEWAY && canEnterOneWay(move, oneFurtherLayer.background))
  ) {
    // Pushing a fill capable tile into a crater.
    if (fillCapableTiles.includes(moveToLayer.foreground.id) && oneFurtherLayer.foreground.id === TileType.CRATER) {
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
      next.board.setTile(oneFurther.y, oneFurther.x, emptyTile);
      next.soundEvent = SoundEvent.FILL;
    }

    // Pushing a pushable tile to an empty tile.
    if (pushableTiles.includes(moveToLayer.foreground.id) && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      next.board.setTile(oneFurther.y, oneFurther.x, moveToLayer.foreground);
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
      next.soundEvent = SoundEvent.PUSH;
    }

    // Pushing an ice block into an empty tile (slides until it hits a non-empty tile).
    if (moveToLayer.foreground.id === TileType.ICE_BLOCK && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      // Start from one tile further in the direction of movement.
      let currX = oneFurther.x;
      let currY = oneFurther.y;
      let prevX = currX;
      let prevY = currY;

      // Keep sliding until we hit something.
      while (currX >= -1 && currX < dimensions[1] + 1 && currY >= -1 && currY < dimensions[0] + 1) {
        const currLayer = next.board.getLayer(currY, currX, true);

        // If we hit a crater, fill it
        if (currLayer.foreground.id === TileType.CRATER) {
          next.board.setTile(currY, currX, emptyTile);
          next.soundEvent = SoundEvent.FILL;
          break;
        }

        if (
          (currLayer.foreground.id !== TileType.EMPTY) || // Stop if we hit a solid tile.
          (currLayer.background.id === TileType.ONEWAY && !canEnterOneWay(move, currLayer.background)) || // Stop if we hit a one way tile from wrong direction.
          ([TileType.OUTSIDE, TileType.WALL].includes(currLayer.background.id)) // Stop if we hit a wall or the edge of the board.
        ) {
          next.board.setTile(prevY, prevX, moveToLayer.foreground);
          next.soundEvent = SoundEvent.PUSH; // TODO: Add ice block sliding sound.
          break;
        }

        // Move to next position
        prevX = currX;
        prevY = currY;
        currX += dx;
        currY += dy;
      }
      next.board.setTile(moveTo.y, moveTo.x, emptyTile);
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
          if (explodableTiles.includes(next.board.getTile(i - 1, j, true).id)) next.board.setTile(i - 1, j, littleExplosion);
          if (explodableTiles.includes(next.board.getTile(i + 1, j, true).id)) next.board.setTile(i + 1, j, littleExplosion);
          if (explodableTiles.includes(next.board.getTile(i, j - 1, true).id)) next.board.setTile(i, j - 1, littleExplosion);
          if (explodableTiles.includes(next.board.getTile(i, j + 1, true).id)) next.board.setTile(i, j + 1, littleExplosion);

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

export function isValidMove(game: Game, offset: Offset) {
  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;

  const background = game.board.getBackground(yPos, xPos, true);
  if ([TileType.OUTSIDE, TileType.WALL].includes(background.id)) return false;

  const tile = game.board.getTile(yPos, xPos, true);
  if (tile.id === TileType.CRATER) return false;
  if (tile.id === TileType.DOOR && game.keys === 0) return false;
  if (tile.id === TileType.FLAG && game.coins !== game.maxCoins) return false;

  if (background.id === TileType.ONEWAY) {
    if (background.blocked.includes(Direction.LEFT) && xPos > game.player.x) return false;
    if (background.blocked.includes(Direction.RIGHT) && xPos < game.player.x) return false;
    if (background.blocked.includes(Direction.UP) && yPos > game.player.y) return false;
    if (background.blocked.includes(Direction.DOWN) && yPos < game.player.y) return false;
  }

  if ([...pushableTiles, TileType.ICE_BLOCK].includes(tile.id)) {
    return isPushable(game.board, { x: xPos, y: yPos }, offset);
  }

  return true;
}

export function isPushable(board: LayeredBoard, position: Position, offset: Offset) {
  const moveToLayer = board.getLayer(position.y, position.x);
  const oneFurtherLayer = board.getLayer(position.y + offset.dy, position.x + offset.dx, true);

  let move;
  if (offset.dy === -1) {
    move = Direction.UP;
  } else if (offset.dy === 1) {
    move = Direction.DOWN;
  } else if (offset.dx === -1) {
    move = Direction.LEFT;
  } else {
    move = Direction.RIGHT;
  }

  if (
    oneFurtherLayer.background.id === TileType.EMPTY ||
    (oneFurtherLayer.background.id === TileType.ONEWAY && canEnterOneWay(move, oneFurtherLayer.background))
  ) {
    // Pushing a fill capable tile into a crater.
    if (fillCapableTiles.includes(moveToLayer.foreground.id) && oneFurtherLayer.foreground.id === TileType.CRATER) {
      return true;
    }

    // Pushing a pushable tile to an empty tile.
    if (pushableTiles.includes(moveToLayer.foreground.id) && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      return true;
    }

    // Pushing an ice block into an empty tile (slides until it hits a non-empty tile).
    if (moveToLayer.foreground.id === TileType.ICE_BLOCK && oneFurtherLayer.foreground.id === TileType.EMPTY) {
      return true;
    }
  }

  return false;
}

export function pushIceBlock(board: LayeredBoard, playerPosition: Position, move: Direction): Position {
  const dimensions = [board.height, board.width];
  const { dx, dy } = directionToOffset(move);

  // Start from the tile the ice block would first be pushed to.
  let currX = playerPosition.x + 2*dx;
  let currY = playerPosition.y + 2*dy;
  let prevX = currX;
  let prevY = currY;

  // Keep sliding until we hit something.
  while (currX >= -1 && currX < dimensions[1] + 1 && currY >= -1 && currY < dimensions[0] + 1) {
    const currLayer = board.getLayer(currY, currX, true);

    // We hit a crater, return the crater position since we will fill it.
    if (currLayer.foreground.id === TileType.CRATER) {
      return { x: currX, y: currY };
    }

    if (
      (currLayer.foreground.id !== TileType.EMPTY) || // Stop if we hit a solid tile.
      (currLayer.background.id === TileType.ONEWAY && !canEnterOneWay(move, currLayer.background)) || // Stop if we hit a one way tile from wrong direction.
      ([TileType.OUTSIDE, TileType.WALL].includes(currLayer.background.id)) // Stop if we hit a wall or the edge of the board.
    ) {
      return { x: prevX, y: prevY };
    }

    // Move to next position
    prevX = currX;
    prevY = currY;
    currX += dx;
    currY += dy;
  }

  throw new Error("Assert never: ice block push loop exited without returning a position.");
}