import { MinQueue } from "heapify";
import { Game, Position, doGameMove } from "./logic";
import { Board, Direction, TileType } from "./types";
import TrueSet from "./TrueSet";

function manhattanDistance(positionA: Position, positionB: Position): number {
  return Math.abs(positionA.x - positionB.x) + Math.abs(positionA.y - positionB.y);
}

function areGameStatesEqual(stateA: Game, stateB: Game): boolean {
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
  game: Game,
  direction: Direction,
}

function getGameStateSuccessors(gameState: Game) {
  const successors: SuccessorState[] = [];

  directions.forEach(direction => {
    const successor = doGameMove(gameState, direction);

    if (!areGameStatesEqual(gameState, successor)) { 
      successors.push({ game: successor, direction: direction });
    }
  });

  return successors;
}

type HeuristicFunction = (state: Game) => number;

interface SearchNode {
  game: Game,
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

  const startState = { game: start, path: [] };
  const visited = new TrueSet();
  
  let count = 0;
  const states: { [key: number]: SearchNode } = {};
  const frontier = new MinQueue(9999);

  states[count] = startState;
  frontier.push(count, heuristic(start));
  count++;

  while (true) {
    if (frontier.size === 0) return null;

    const currentIndex = frontier.pop()!;
    const currentState = states[currentIndex];
    delete states[currentIndex];

    if (currentState.game.won) {
      const endTime = new Date().getTime();
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

function coinDistanceHeuristic(state: Game) {
  const coins = getTilePositions(state.board, TileType.COIN);
  
  let total = 0;
  coins.forEach(coin => {
    total += manhattanDistance(state.player, coin);
  });

  return total;
}

function cratesCratersHeuristic(state: Game) {
  const crates = getTileCount(state.board, TileType.CRATE);
  const craters = getTileCount(state.board, TileType.CRATE);

  return crates + craters;
}

function keysDoorsHeuristic(state: Game) {
  const keys = getTilePositions(state.board, TileType.KEY);
  const doors = getTilePositions(state.board, TileType.DOOR);
  const tiles = [...keys, ...doors];

  let total = 0;
  tiles.forEach(tile => {
    total += manhattanDistance(state.player, tile);
  });

  return total;
}

export function compoundHeuristic(state: Game) {
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