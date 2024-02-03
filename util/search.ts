// import { MinQueue } from "heapify";
// import { Game, Position, boundTileAt, canMoveTo, countInstancesInBoard, doGameMove } from "./logic";
// import { Board, Direction, TileType } from "./types";
// import TrueSet from "./TrueSet";

// /**
//  * This represents a compressed version of the Game interface which
//  * only includes fields absolutely necessary for aStarSearch.
//  * 
//  * The search algorithm determines successors by using the actual
//  * game logic function doGameMove, which also modifies soundEvent
//  * so this property must be removed.
//  */
// interface BaseGameState {
//   board: Board,
//   player: Position,
//   maxCoins: number,
//   coins: number,
//   keys: number,
//   won: boolean,
// }

// const validKeys = ["board", "player", "maxCoins", "coins", "keys", "won"];

// function pruneGameStateObject(state: Game): BaseGameState {
//   const prunedState = { ...state };
//   Object.keys(prunedState).forEach((key) => {
//     // @ts-expect-error This is stupid, all of these keys will exist on the object.
//     if (!validKeys.includes(key)) delete prunedState[key];
//   });
//   return prunedState;
// }

// function manhattanDistance(positionA: Position, positionB: Position): number {
//   return Math.abs(positionA.x - positionB.x) + Math.abs(positionA.y - positionB.y);
// }

// function areGameStatesEqual(stateA: BaseGameState, stateB: BaseGameState): boolean {
//   if (stateA.player.x !== stateB.player.x) return false;
//   if (stateA.player.y !== stateB.player.y) return false;

//   if (stateA.coins !== stateB.coins) return false;
//   if (stateA.keys !== stateB.keys) return false;

//   if (stateA.won !== stateB.won) return false;
//   return areBoardStatesEqual(stateA.board, stateB.board);
// }

// function areBoardStatesEqual(boardA: Board, boardB: Board): boolean {
//   for (let y = 0; y < boardA.length; y++) {
//     for (let x = 0; x < boardA[0].length; x++) {
//       if (boardA[y][x] !== boardB[y][x]) return false;
//     }
//   }

//   return true;
// }

// const directions = Object.keys(Direction)
//   .filter((key) => !isNaN(Number(key)))
//   .map((key) => parseInt(key)) as Direction[];

// interface SuccessorState {
//   game: BaseGameState,
//   direction: Direction[],
// }

// function getGameStateSuccessors(gameState: BaseGameState) {
//   const successors: SuccessorState[] = [];

//   directions.forEach(direction => {
//     const [successor, moved] = doGameMove(gameState as Game, direction);

//     if (moved && !areGameStatesEqual(gameState, successor)) { // TOOD: The boolean moved should eliminate the need for areGameStatesEqual, right?
//       successors.push({
//         game: pruneGameStateObject(successor),
//         direction: [direction],
//       });
//     }
//   });

//   const keys = getTilePositions(gameState.board, TileType.KEY);
//   const coins = getTilePositions(gameState.board, TileType.COIN);

//   [...keys, ...coins].forEach(position => {
//     const path = canMoveTo(gameState as Game, position.x, position.y);

//     if (path) {
//       let successor = gameState as Game;
//       for (let i = 0; i < path.length; i++) {
//         [successor] = doGameMove(successor, path[i]);
//       }

//       successors.push({
//         game: pruneGameStateObject(successor),
//         direction: path,
//       })
//     }
//   });

//   for (let i = successors.length - 1; i >= 0; i--) {
//     if (isDeadEnd(successors[i].game)) {
//       successors.splice(i, 1);
//     }
//   }

//   return successors;
// }

// type HeuristicFunction = (state: BaseGameState) => number;

// interface SearchNode {
//   game: BaseGameState,
//   path: Direction[],
// }

// function printBoard(board: Board, player: Position) {
//   const dimensions = [board.length, board[0].length];

//   for (let i = 0; i < dimensions[0]; i++) {
//     let row = "[";
//     for (let j = 0; j < dimensions[1]; j++) {
//       row += " " + board[i][j].id;

//       if (i === player.y && j === player.x) row = row.slice(0, -2) + " P";
//     }

//     console.log(row + " ]");
//   }
// }

// export function aStarSearch(start: Game, heuristic: HeuristicFunction): Direction[] | null {
//   const startTime = new Date().getTime();
//   console.log("\n\nStarting A* search with heuristic function:", heuristic);

//   const startState = { game: pruneGameStateObject(start), path: [] };
//   const visited = new TrueSet();

//   let count = 0;
//   let duplicates = 0;
//   const maxSearches = 100000;

//   const states: { [key: number]: SearchNode } = {};
//   const frontier = new MinQueue(256);

//   states[count] = startState;
//   frontier.push(count, heuristic(start));
//   count++;

//   let prevCapacity = 256;

//   while (count < maxSearches) {
//     if (frontier.size === 0) return null;

//     const currentIndex = frontier.pop()!;
//     const currentState = states[currentIndex];
//     delete states[currentIndex];

//     if (frontier.capacity !== prevCapacity) {
//       prevCapacity = frontier.capacity;
//       console.log("Doubled capacity:", frontier.capacity);
//       console.log("Current count:", count);
//     }

//     if (currentState.game.won) {
//       const endTime = new Date().getTime();
//       console.log(`Searched ${count} nodes, ${duplicates} of which were duplicates.`);
//       console.log(`Found a ${currentState.path.length} move solution in ${(endTime - startTime) / 1000} seconds:`);
//       console.log(currentState.path.map(step => Direction[step]));
//       return currentState.path;
//     }
//     if (visited.has(currentState.game)) {
//       duplicates++;
//       continue;
//     }

//     visited.add(currentState.game);
//     const successors = getGameStateSuccessors(currentState.game);

//     successors.forEach(successor => {
//       const path = [...currentState.path, ...successor.direction];
//       const nextState = { game: successor.game, path: path };

//       states[count] = nextState;
//       frontier.push(count, heuristic(nextState.game));
//       count++;
//     });
//   }

//   const endTime = new Date().getTime();
//   console.log(`Searched for ${(endTime - startTime) / 1000} seconds.`);
//   console.log(`Unable to find a solution with fewer than ${maxSearches} nodes expanded, ${duplicates} of which were duplicates.`);

//   const finalState = states[frontier.pop()!];
//   printBoard(finalState.game.board, finalState.game.player);
//   console.log(finalState.path.map(step => Direction[step]));
//   return null;
// }

// function getTilePositions(board: Board, type: TileType): Position[] {
//   const dimensions = [board.length, board[0].length];
//   const positions = [];

//   for (let i = 0; i < dimensions[0]; i++) {
//     for (let j = 0; j < dimensions[1]; j++) {
//       if (board[i][j].id === type) {
//         positions.push({ y: i, x: j });
//       }
//     }
//   }

//   return positions;
// }

// /**
//  * Returns true if the game state is an unwinnable dead end. 
//  * Note that a false return value does NOT guarantee that the 
//  * game state is winnable.
//  */
// function isDeadEnd(state: BaseGameState): boolean {
//   const mustReachTiles = [TileType.COIN, TileType.FLAG];
//   const dimensions = [state.board.length, state.board[0].length];

//   for (let i = 0; i < dimensions[0]; i++) {
//     for (let j = 0; j < dimensions[1]; j++) {
//       if (mustReachTiles.includes(state.board[i][j].id)) {
//         const checkPosition = { y: i, x: j };
//         if (!isTileReachable(state.board, checkPosition)) return true;
//       }
//     }
//   }

//   return false;
// }

// function isTileReachable(board: Board, tile: Position) {
//   const clearable = [
//     TileType.EMPTY,
//     TileType.BOMB,
//     TileType.KEY,
//     TileType.COIN,
//     TileType.DOOR,
//     TileType.CRATER,
//     TileType.EXPLOSION,
//     TileType.LITTLE_EXPLOSION,

//     // TODO: Remove this, after adding oneway tile logic.
//     TileType.ONEWAY,
//   ];

//   for (let i = -1; i < 2; i++) {
//     for (let j = -1; j < 2; j++) {
//       if (i === 0 && j === 0) continue;
//       const checkPosition = { y: tile.y + i, x: tile.x + j };
//       const adjacentTile = boundTileAt(checkPosition.y, checkPosition.x, board);

//       if (clearable.includes(adjacentTile.id)) return true;
//       // if (something) TODO: some kind of logic for oneway tiles
//       if (adjacentTile.id === TileType.CRATE && isCrateMoveable(board, checkPosition)) return true;
//     }
//   }

//   return true;
// }

// function isCrateMoveable(board: Board, tile: Position) {
//   const pushableTargets = [TileType.EMPTY, TileType.CRATER];

//   for (let i = -1; i < 2; i++) {
//     for (let j = -1; j < 2; j++) {
//       if (i === 0 && j === 0) continue;

//       const adjacentTile = boundTileAt(tile.y + i, tile.x + j, board);
//       const oppositeTile = boundTileAt(tile.y - i, tile.x - j, board);
//       if (
//         pushableTargets.includes(oppositeTile.id) &&
//         adjacentTile.id === TileType.EMPTY
//       ) return true;
//     }
//   }

//   return false;
// }

// // HEURISTIC FUNCTIONS

// function coinDistanceHeuristic(state: BaseGameState) {
//   const coins = getTilePositions(state.board, TileType.COIN);

//   let total = 0;
//   coins.forEach(coin => {
//     total += manhattanDistance(state.player, coin);
//   });

//   return total;
// }

// function cratesCratersHeuristic(state: BaseGameState) { // TODO: Including craters may make the heuristic inadmissible, particularly with bombs.
//   const crates = countInstancesInBoard(state.board, TileType.CRATE);
//   const craters = countInstancesInBoard(state.board, TileType.CRATE);

//   return crates + craters;
// }

// function keysDoorsHeuristic(state: BaseGameState) {
//   const keys = getTilePositions(state.board, TileType.KEY);
//   const doors = getTilePositions(state.board, TileType.DOOR);
//   const tiles = [...keys, ...doors];

//   let total = 0;
//   tiles.forEach(tile => {
//     total += manhattanDistance(state.player, tile);
//   });

//   return total;
// }

// export function compoundHeuristic(state: BaseGameState) {
//   const maxDistance = state.board.length + state.board[0].length;
//   const stepSize = maxDistance * (state.board.length * state.board[0].length);

//   const componentHeuristics = [
//     countInstancesInBoard(state.board, TileType.COIN),
//     coinDistanceHeuristic(state),
//     keysDoorsHeuristic(state),
//     cratesCratersHeuristic(state),
//   ];

//   const heuristicWeights = [
//     stepSize * 3,
//     stepSize * 2,
//     stepSize,
//     1,
//   ];

//   let value = 0;
//   for (let i = 0; i < componentHeuristics.length; i++) {
//     value += componentHeuristics[i] * heuristicWeights[i];
//   }

//   return value;
// }

// export function basicHeuristic(state: BaseGameState) {
//   const tilesOfInterest = [
//     ...getTilePositions(state.board, TileType.FLAG),
//     ...getTilePositions(state.board, TileType.COIN),
//   ];
  
//   let maxDistance = 0;
//   tilesOfInterest.forEach(tilePosition => {
//     const distance = manhattanDistance(state.player, tilePosition);
//     maxDistance = Math.max(maxDistance, distance);
//   });

//   return maxDistance;
// }