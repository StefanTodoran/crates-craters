import { MinQueue } from "heapify";
import { Game, Position, boundTileAt, doGameMove } from "./logic";
import { Board, BoardTile, Direction, TileType } from "./types";
import TrueSet from "./TrueSet";

/**
 * This represents a compressed version of the Game interface which
 * only includes fields absolutely necessary for aStarSearch.
 * 
 * The search algorithm determines successors by using the actual
 * game logic function doGameMove, which also modifies soundEvent
 * so this property must be removed.
 */
interface BaseGameState {
  board: Board,
  player: Position,
  maxCoins: number,
  coins: number,
  keys: number,
  won: boolean,
}

const validKeys = ["board", "player", "maxCoins", "coins", "keys", "won"];

function pruneGameStateObject(state: Game): BaseGameState {
  const prunedState = { ...state };
  Object.keys(prunedState).forEach((key) => {
    // @ts-expect-error This is stupid, all of these keys will exist on the object.
    if (!validKeys.includes(key)) delete prunedState[key];
  });
  return prunedState;
}

function manhattanDistance(positionA: Position, positionB: Position): number {
  return Math.abs(positionA.x - positionB.x) + Math.abs(positionA.y - positionB.y);
}

function areGameStatesEqual(stateA: BaseGameState, stateB: BaseGameState): boolean {
  if (stateA.player.x !== stateB.player.x) return false;
  if (stateA.player.y !== stateB.player.y) return false;

  if (stateA.coins !== stateB.coins) return false;
  if (stateA.keys !== stateB.keys) return false;

  if (stateA.won !== stateB.won) return false;
  return areBoardStatesEqual(stateA.board, stateB.board);
}

function areBoardStatesEqual(boardA: Board, boardB: Board): boolean {
  for (let y = 0; y < boardA.length; y++) {
    for (let x = 0; x < boardA[0].length; x++) {
      if (boardA[y][x] !== boardB[y][x]) return false;
    }
  }

  return true;
}

const directions = Object.keys(Direction)
  .filter((key) => !isNaN(Number(key)))
  .map((key) => parseInt(key)) as Direction[];

interface SuccessorState {
  game: BaseGameState,
  direction: Direction,
}

function getGameStateSuccessors(gameState: BaseGameState) {
  const successors: SuccessorState[] = [];

  directions.forEach(direction => {
    const successor = doGameMove(gameState as Game, direction);

    if (!areGameStatesEqual(gameState, successor)) {
      successors.push({
        game: pruneGameStateObject(successor),
        direction: direction,
      });
    }
  });

  return successors;
}

type HeuristicFunction = (state: BaseGameState) => number;

interface SearchNode {
  game: BaseGameState,
  path: Direction[],
}

function printBoard(board: Board, player: Position) {
  const dimensions = [board.length, board[0].length];

  for (let i = 0; i < dimensions[0]; i++) {
    let row = "[";
    for (let j = 0; j < dimensions[1]; j++) {
      row += " " + board[i][j].id;

      if (i === player.y && j === player.x) row = row.slice(0, -2) + " P";
    }

    console.log(row + " ]");
  }
}

export function aStarSearch(start: Game, heuristic: HeuristicFunction): Direction[] | null {
  const startTime = new Date().getTime();

  const startState = { game: pruneGameStateObject(start), path: [] };
  const visited = new TrueSet();

  let count = 0;
  const states: { [key: number]: SearchNode } = {};
  const frontier = new MinQueue(256);

  states[count] = startState;
  frontier.push(count, heuristic(start));
  count++;

  while (count < 10000) {
    if (frontier.size === 0) return null;

    const currentIndex = frontier.pop()!;
    const currentState = states[currentIndex];
    delete states[currentIndex];

    if (currentState.game.won) {
      const endTime = new Date().getTime();
      console.log(`Searched ${count} nodes.`);
      console.log(`Found a solution in ${(endTime - startTime) / 1000} seconds:`);
      console.log(currentState.path.map(step => Direction[step]));
      return currentState.path;
    }
    if (visited.has(currentState.game)) continue;

    visited.add(currentState.game);
    const successors = getGameStateSuccessors(currentState.game);

    successors.forEach(successor => {
      const path = [...currentState.path, successor.direction];
      const nextState = { game: successor.game, path: path };

      states[count] = nextState;
      frontier.push(count, heuristic(nextState.game));
      count++;
    });
  }

  return null;
}

function getTileCount(board: Board, type: TileType): number {
  const dimensions = [board.length, board[0].length];
  let count = 0;

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (board[i][j].id === type) {
        count += 1;
      }
    }
  }

  return count;
}

function getTilePositions(board: Board, type: TileType): Position[] {
  const dimensions = [board.length, board[0].length];
  const positions = [];

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (board[i][j].id === type) {
        positions.push({ y: i, x: j });
      }
    }
  }

  return positions;
}

function coinDistanceHeuristic(state: BaseGameState) {
  const coins = getTilePositions(state.board, TileType.COIN);

  let total = 0;
  coins.forEach(coin => {
    total += manhattanDistance(state.player, coin);
  });

  return total;
}

function cratesCratersHeuristic(state: BaseGameState) {
  const crates = getTileCount(state.board, TileType.CRATE);
  const craters = getTileCount(state.board, TileType.CRATE);

  return crates + craters;
}

function keysDoorsHeuristic(state: BaseGameState) {
  const keys = getTilePositions(state.board, TileType.KEY);
  const doors = getTilePositions(state.board, TileType.DOOR);
  const tiles = [...keys, ...doors];

  let total = 0;
  tiles.forEach(tile => {
    total += manhattanDistance(state.player, tile);
  });

  return total;
}

/**
 * This heuristic function is slightly different from the
 * other heuristics, in that it returns true if the game state
 * is an unwinnable dead end. Note that a false return value
 * does NOT guarantee that the game state is winnable.
 */
function deadEndHeuristic(state: BaseGameState): boolean {
  let winnable = true;
  const mustReachTiles = [TileType.COIN, TileType.FLAG];

  const dimensions = [state.board.length, state.board[0].length];
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (mustReachTiles.includes(state.board[i][j].id)) {
        //
      }
    }
  }

  return winnable;
}

function isTileReachable(board: Board, tile: Position) {
  const clearable = [
    TileType.EMPTY,
    TileType.BOMB,
    TileType.KEY,
    TileType.COIN,
    TileType.DOOR,
    TileType.CRATER,
    TileType.EXPLOSION,
    TileType.LITTLE_EXPLOSION,
  ];

  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue;
      const checkPosition = { y: tile.y + i, x: tile.x + j };
      const adjacentTile = boundTileAt(checkPosition.y, checkPosition.x, board);

      if (clearable.includes(adjacentTile.id)) return true;
      // if (something) TODO: some kind of logic for oneway tiles
      if (adjacentTile.id === TileType.CRATE && isCrateMoveable(board, checkPosition)) return true;
    }
  }

  return true;
}

function isCrateMoveable(board: Board, tile: Position) {
  const pushableTargets = [TileType.EMPTY, TileType.CRATER];

  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      if (i === 0 && j === 0) continue;

      const adjacentTile = boundTileAt(tile.y + i, tile.x + j, board);
      if (pushableTargets.includes(adjacentTile.id)) return true;
    }
  }

  return false;
}

export function compoundHeuristic(state: BaseGameState) {
  const maxDistance = state.board.length + state.board[0].length;
  const stepSize = maxDistance * (state.board.length * state.board[0].length);

  const componentHeuristics = [
    getTileCount(state.board, TileType.COIN),
    coinDistanceHeuristic(state),
    keysDoorsHeuristic(state),
    cratesCratersHeuristic(state),
  ];

  const heuristicWeights = [
    stepSize * 3,
    stepSize * 2,
    stepSize,
    1,
  ];

  let value = 0;
  for (let i = 0; i < componentHeuristics.length; i++) {
    value += componentHeuristics[i] * heuristicWeights[i];
  }

  return value;
}