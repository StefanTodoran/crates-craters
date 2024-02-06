import Queue from "./Queue";
import { PositionSet } from "./Set";
import { OneWayTile, Direction, TileType, Board, SimpleTile, Level, BoardTile } from "./types";

export enum SoundEvent {
  EXPLOSION,
  PUSH,
  FILL,
  DOOR,
  COLLECT,
  MOVE,
}

export interface Position {
  x: number,
  y: number,
}

export interface Game {
  uuid: string,
  name: string,
  board: Board,
  // official: boolean,

  player: Position,
  maxCoins: number, // The number of coins needed to complete the level.
  coins: number,
  keys: number,
  won: boolean, // Whether the curren run of the level has been completed.
  soundEvent?: SoundEvent,
  moveCount: number,
}

// Deep copy of a game object.
function cloneGameObj(game: Game): Game {
  return {
    ...game,
    board: cloneBoard(game.board),
    player: { y: game.player.y, x: game.player.x },
  }
}

export function cloneBoard(board: Board) {
  const newBoard = [];

  for (let i = 0; i < board.length; i++) {
    const newRow = [];
    for (let j = 0; j < board[i].length; j++) {
      const newTile = { ...board[i][j] };
      newRow.push(newTile);
    }
    newBoard[i] = newRow;
  }

  return newBoard;
}

export function validTile(yPos: number, xPos: number, board: Board) {
  return (yPos >= 0 && yPos < board.length && xPos >= 0 && xPos < board[0].length);
}

/**
 * Can the player walk on the given tile. By default this includes empty
 * tiles and the flag if win conditions are met. Extra adds to walkable tiles.
 * Direction should be provided if extra contains oneway tiles, otherwise any direction
 * of oneway can be walked on.
 */
export function canWalkTile(yPos: number, xPos: number, game: Game, extra?: TileType[], direction?: Direction) {
  if (validTile(yPos, xPos, game.board)) {
    let walkable = [TileType.EMPTY, TileType.SPAWN];
    if (extra) walkable = walkable.concat(extra);

    const targetTile = tileAt(yPos, xPos, game.board);
    if (targetTile.id === TileType.FLAG && game.coins === game.maxCoins) {
      return true; // We can only walk on the flag if we have all the coins!
    }

    let canWalk = walkable.includes(targetTile.id);
    if (
      canWalk &&
      direction !== undefined &&
      targetTile.id === TileType.ONEWAY &&
      !canWalkOneWay(direction, targetTile)
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
 * Queries the target position without bounds checking.
 */
export function tileAt(yPos: number, xPos: number, board: Board) {
  return board[yPos][xPos];
}

/**
 * Queries the target position with bounds checking, returning
 * the special outside tile type if the query is out of bounds.
 */
export function boundTileAt(yPos: number, xPos: number, board: Board): BoardTile {
  if (validTile(yPos, xPos, board)) {
    return board[yPos][xPos];
  }
  return { id: TileType.OUTSIDE };
}

/**
 * Returns the player spawn position in the given level.
 * @param {Board} board The board[][] you wish to search. 
 * @returns {Position} Returns a position of the form {y: number, x: number}
 */
export function getSpawnPosition(board: Board): Position {
  const dimensions = [board.length, board[0].length];

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (board[i][j].id === TileType.SPAWN) {
        return { y: i, x: j };
      }
    }
  }

  return { y: NaN, x: NaN };
}

/**
 * Returns the number of time some value shows up in an array.
 */
export function countInstancesInBoard(board: Board, target: TileType) {
  const dimensions = [board.length, board[0].length];
  let count = 0;

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (board[i][j].id === target) {
        count++;
      }
    }
  }

  return count;
}

const emptyTile: SimpleTile = { id: TileType.EMPTY };
const crateTile: SimpleTile = { id: TileType.CRATE };

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

  const visited = new PositionSet(game.board[0].length);
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
  if (!validTile(moveTo.y, moveTo.x, next.board)) {
    // The user attempted to move outside the board.
    return [game, false];
  }

  // Clear explosion tiles.
  const dimensions = [next.board.length, next.board[0].length];
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (
        tileAt(i, j, next.board).id === TileType.EXPLOSION ||
        tileAt(i, j, next.board).id === TileType.LITTLE_EXPLOSION
      ) {
        next.board[i][j] = emptyTile;
      }
    }
  }

  // The basic structure of how this section works is that if the moveTo position is
  // on some tile that could be walked on after some game logic (e.g. a coin tile or 
  // door when keys > 0) then we do that logic and clear the tile. At the end of all the
  // logic, we run attemptMove which only succeeds and moves the player if moveTo is now
  // empty (e.g. the coin tile was collected & cleared or the door was opened & cleared)

  const moveToTile = tileAt(moveTo.y, moveTo.x, next.board);
  const oneFurtherTile = boundTileAt(oneFurther.y, oneFurther.x, next.board);

  // If we walked onto a collectable, add it to the inventory
  // and clear the tile on the new board object.
  if (moveToTile.id === TileType.COIN) {
    next.coins += 1;
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.soundEvent = SoundEvent.COLLECT;
  }
  if (moveToTile.id === TileType.KEY) {
    next.keys += 1;
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.soundEvent = SoundEvent.COLLECT;
  }

  // If we walked into a door and have the means to open it, do so.
  if (game.keys > 0 && moveToTile.id === TileType.DOOR) {
    next.keys -= 1;
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.soundEvent = SoundEvent.DOOR;
  }

  // Pushing a crate onto an empty tile.
  if (moveToTile.id === TileType.CRATE && oneFurtherTile.id === TileType.EMPTY) {
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.board[oneFurther.y][oneFurther.x] = crateTile;
    next.soundEvent = SoundEvent.PUSH;
  }

  // Pushing a crate into a crater.
  if (moveToTile.id === TileType.CRATE && oneFurtherTile.id === TileType.CRATER) {
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.board[oneFurther.y][oneFurther.x] = emptyTile;
    next.soundEvent = SoundEvent.FILL;
  }

  // Pushing a bomb onto an empty tile.
  if (moveToTile.id === TileType.BOMB && oneFurtherTile.id === TileType.EMPTY) {
    next.board[moveTo.y][moveTo.x] = emptyTile;
    next.board[oneFurther.y][oneFurther.x] = moveToTile;
    next.soundEvent = SoundEvent.PUSH;
  }

  const moved = attemptMove(moveTo.y, moveTo.x, next, move);
  if (!moved) return [game, false];

  // Tile entity logic handling. If we haven't moved, we shouldn't
  // decrease bomb fuse (invalid moves shouldn't count as a timestep).

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      const tile = tileAt(i, j, next.board);

      if (tile.id === TileType.BOMB) {
        tile.fuse--;

        if (tile.fuse === 0) {
          const littleExplosion: SimpleTile = { id: TileType.LITTLE_EXPLOSION };
          if (boundTileAt(i - 1, j, next.board).id === TileType.CRATE) { next.board[i - 1][j] = littleExplosion; }
          if (boundTileAt(i + 1, j, next.board).id === TileType.CRATE) { next.board[i + 1][j] = littleExplosion; }
          if (boundTileAt(i, j - 1, next.board).id === TileType.CRATE) { next.board[i][j - 1] = littleExplosion; }
          if (boundTileAt(i, j + 1, next.board).id === TileType.CRATE) { next.board[i][j + 1] = littleExplosion; }

          next.board[i][j] = { id: TileType.EXPLOSION };
          next.soundEvent = SoundEvent.EXPLOSION;
        }
      }
    }
  }

  next.won = winCondition(next);
  next.moveCount++;

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
  return tileAt(next.player.y, next.player.x, next.board).id === TileType.FLAG && (next.coins === next.maxCoins);
}

/**
 * Creates a new game object for the given level.
 * @returns A Game object properly set up for game start.
 */
export function initializeGameObj(level: Level): Game {
  const board = cloneBoard(level.board);
  const numberOfCoins = countInstancesInBoard(board, TileType.COIN);

  const startPos = getSpawnPosition(board);
  board[startPos.y][startPos.x] = emptyTile;

  return {
    uuid: level.uuid,
    name: level.name,
    board: board,
    player: startPos,
    maxCoins: numberOfCoins,
    coins: 0,
    keys: 0,
    won: false,
    moveCount: 0,
  };
}