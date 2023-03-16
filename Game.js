// Contains level data for the game as well
// as some helpful consts for dealing with that data.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { graphics } from './Theme';
import Queue from './components/Queue';

const level_one = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 4, 0, 1],
  [1, 0, 7, 0, 1, 0, 4, 1],
  [1, 0, 0, 0, 1, 5, 0, 1],
  [1, 4, 4, 4, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 6, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1],
  [1, 1, 1, 1, 1, 4, 4, 1],
  [1, 0, 0, 0, 1, 5, 5, 1],
  [1, 0, 6, 0, 2, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 8, 0, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];
const level_two = [
  [4, 4, 0, 0, 0, 0, 4, 5],
  [4, 0, 0, 0, 1, 4, 3, 4],
  [0, 0, 5, 0, 0, 4, 4, 0],
  [1, 0, 1, 1, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 5, 6, 5, 1, 0, 0, 0],
  [4, 4, 5, 4, 1, 0, 0, 5],
  [0, 4, 4, 0, 0, 0, 4, 6],
  [0, 0, 0, 0, 1, 1, 1, 2],
  [0, 0, 5, 0, 4, 0, 8, 0],
  [0, 6, 0, 0, 1, 1, 1, 4],
  [4, 0, 0, 4, 1, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 7, 0],
  [1, 4, 0, 0, 4, 0, 0, 0],
];
const level_three = [
  [0, 0, 2, 0, 1, 1, 1, 3],
  [0, 0, 1, 0, 1, 0, 0, 5],
  [4, 4, 1, 0, 2, 0, 4, 0],
  [5, 5, 1, 0, 1, 6, 0, 4],
  [4, 0, 1, 0, 1, 1, 1, 1],
  [0, 0, 1, 0, 1, 4, 4, 0],
  [8, 1, 0, 4, 5, 1, 1, 0],
  [1, 1, 5, 7, 0, 1, 1, 5],
  [1, 3, 4, 4, 4, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 4, 4, 0, 0, 1, 6],
  [0, 0, 0, 0, 4, 5, 1, 5],
  [1, 1, 1, 1, 2, 1, 1, 4],
  [1, 1, 1, 3, 0, 0, 0, 0],
];
const level_four = [
  [0, 0, 0, 6, 1, 0, 0, 0],
  [0, 4, 0, 1, 0, 0, 3, 5],
  [4, 0, 4, 1, 0, 4, 4, 0],
  [0, 4, 0, 1, 0, 4, 5, 0],
  [0, 6, 0, 1, 4, 4, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 5],
  [1, 1, 1, 1, 0, 0, 1, 0],
  [0, 0, 6, 5, 4, 1, 0, 0],
  [1, 1, 0, 4, 7, 4, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 0, 0, 1, 8, 1, 5, 4],
  [4, 4, 0, 0, 1, 0, 0, 6],
  [6, 0, 5, 0, 0, 0, 0, 0],
];
const level_five = [
  [0, 0, 0, 1, 0, 1, 1, 0],
  [0, 7, 0, 0, 4, 0, 8, 0],
  [0, 0, 0, 1, 0, 0, 1, 5],
  [0, 0, 0, 1, 3, 0, 1, 1],
  [0, 4, 4, 1, 5, 1, 4, 4],
  [0, 4, 0, 1, 0, 0, 0, 4],
  [4, 0, 0, 1, 0, 6, 0, 0],
  [1, 0, 1, 1, 0, 0, 5, 0],
  [0, 0, 0, 0, 0, 5, 4, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 2, 1, 0, 6, 0, 0, 0],
  [0, 0, 5, 0, 0, 1, 1, 4],
  [0, 6, 5, 0, 0, 1, 6, 0],
  [6, 0, 1, 0, 0, 4, 0, 0],
];
const level_six = [
  [0, 0, 1, 8, 1, 1, 1, 1],
  [0, 6, 1, 2, 1, 0, 6, 0],
  [4, 0, 5, 5, 0, 4, 4, 4],
  [0, 0, 1, 0, 1, 0, 0, 0],
  [4, 0, 1, 0, 1, 0, 4, 0],
  [0, 4, 1, 0, 1, 0, 5, 4],
  [0, 0, 1, 0, 1, 5, 0, 0],
  [0, 0, 4, 7, 4, 0, 0, 0],
  [6, 4, 1, 4, 1, 0, 0, 0],
  [1, 1, 1, 0, 1, 1, 1, 1],
  [6, 5, 1, 0, 5, 4, 0, 3],
  [4, 0, 0, 0, 4, 0, 4, 0],
  [0, 4, 0, 0, 5, 4, 0, 0],
  [0, 0, 4, 0, 4, 0, 4, 6],
];
const level_seven = [
  [3, 0, 5, 0, 0, 1, 6, 3],
  [4, 4, 0, 4, 4, 1, 1, 2],
  [4, 0, 4, 0, 0, 0, 0, 5],
  [0, 4, 1, 1, 1, 8, 0, 0],
  [4, 0, 1, 6, 1, 1, 1, 0],
  [0, 5, 1, 5, 1, 0, 1, 0],
  [0, 0, 2, 7, 0, 0, 0, 0],
  [0, 0, 1, 4, 4, 4, 1, 4],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [5, 0, 1, 1, 2, 1, 1, 0],
  [0, 6, 1, 0, 0, 1, 0, 0],
  [0, 4, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 6, 1, 3, 4],
  [0, 0, 1, 1, 0, 1, 1, 1],
];
const level_eight = [
  [0, 0, 2, 0, 0, 4, 8, 5],
  [1, 7, 4, 5, 6, 4, 0, 1],
  [0, 4, 0, 5, 1, 0, 0, 4],
  [0, 5, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 6, 1, 0],
  [4, 4, 5, 0, 0, 5, 0, 0],
  [4, 1, 3, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 5, 0, 4],
  [5, 0, 0, 0, 5, 4, 0, 4],
  [2, 1, 1, 0, 0, 0, 0, 0],
  [0, 5, 5, 0, 0, 0, 5, 5],
  [0, 1, 5, 4, 0, 1, 4, 4],
  [6, 4, 1, 6, 4, 5, 3, 0],
  [0, 1, 4, 0, 4, 5, 5, 4],
];
const level_nine = [
  [0, 4, 0, 1, 0, 4, 0, 6],
  [4, 4, 0, 0, 0, 0, 5, 1],
  [0, 0, 0, 4, 0, 5, 0, 0],
  [0, 0, 0, 5, 1, 0, 0, 0],
  [1, 0, 5, 5, 6, 0, 4, 5],
  [4, 0, 6, 0, 0, 0, 4, 4],
  [4, 5, 0, 5, 0, 0, 5, 3],
  [0, 2, 1, 4, 1, 0, 5, 4],
  [0, 0, 4, 7, 4, 5, 5, 6],
  [4, 0, 8, 4, 1, 0, 5, 1],
  [0, 0, 5, 0, 5, 0, 0, 0],
  [2, 1, 0, 5, 0, 0, 0, 1],
  [5, 5, 0, 4, 0, 0, 5, 3],
  [6, 1, 0, 0, 4, 0, 5, 4],
];
const level_ten = [
  [0, 4, 0, 4, 6, 0, 5, 3],
  [4, 4, 0, 0, 0, 1, 0, 5],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 5, "b:35", 0, 4],
  [4, 5, 0, 0, 1, 5, 0, 0],
  [6, 0, 1, 0, 0, 0, 0, 0],
  [4, 1, 0, 0, 0, 0, 0, 0],
  [4, 0, 2, 1, 0, 4, 0, 5],
  [6, 0, 4, 4, 0, 0, 5, 4],
  [1, 5, 1, 1, 0, 1, 6, 5],
  [0, 0, 0, 0, 4, 0, 1, 5],
  [0, 0, 7, 0, 1, 4, 0, 8],
  [4, 4, 0, 0, 0, 0, 5, 4],
  [0, 4, 0, 4, 0, 0, 0, 5],
];
const level_eleven = [
  [4, 4, 5, 0, 0, 6, 1, 4],
  [5, 0, 5, 4, 0, 5, 0, 0],
  [0, 5, 0, 5, 1, 0, 0, 0],
  [0, 4, 0, 5, 0, 1, 0, 8],
  [1, 0, 1, 4, 6, 1, 4, 1],
  [0, 4, 0, 1, 1, 0, 4, 1],
  [0, 1, 4, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [4, 5, 4, 0, 7, 4, 5, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 4, 6, 0, 1, 0, 4],
  [5, 4, 5, 0, 5, 0, 0, 4],
  [4, 0, 3, 4, 0, 0, "b:41", 1],
  [4, 0, 5, 5, 4, 0, 2, 6],
];
const level_twenty = [
  [1, 6, 5, 1, 4, 0, 4, 0],
  [5, 4, 0, 3, 5, 0, 4, 4],
  [0, 4, 1, 1, 0, 0, 0, 0],
  [0, 4, 2, 0, 0, 1, 0, 4],
  [0, 0, 1, 0, 1, 0, 0, 0],
  [8, 0, 5, 4, 0, 0, 5, 5],
  [0, 0, 4, 7, 1, 0, 4, 5],
  [1, 5, 1, 2, 1, 0, 4, 4],
  [5, 5, 5, 0, 0, 0, 5, 3],
  [0, 0, 5, 1, 0, 1, 0, 1],
  [4, 4, 6, 1, 0, 4, 5, 0],
  [0, 4, 1, 1, 5, 5, 1, 0],
  [5, 0, 0, 0, 3, 0, 4, 6],
];

const defaults = [
  // createLevelObj("Bomb", "default", bomb_test),
  createLevelObj("Tutorial", "default", level_one),
  createLevelObj("Easy Peasy", "default", level_two),
  createLevelObj("Rooms", "default", level_three),
  createLevelObj("Choices", "default", level_four),
  createLevelObj("Running Laps", "default", level_five),
  createLevelObj("The Hallway", "default", level_six),
  createLevelObj("Trickster", "default", level_seven),
  createLevelObj("Bust the Wall?", "default", level_eight),
  createLevelObj("Deja Vu", "default", level_nine),
  createLevelObj("Race the Clock", "default", level_ten),
  createLevelObj("Stupid Door", "default", level_eleven),
  createLevelObj("Pain", "default", level_twenty),
];

export let levels = [...defaults];

/**
 * Creates a level object, the type used by level select and parts of Game.js
 * @param {string} name The desired level name.
 * @param {string} designer The name of the individual who designed the level.
 * @param {number[][]} board The board to be used, or null for a blank board.
 * @returns 
 */
export function createLevelObj(name, designer, board) {
  if (board === null) {
    board = createBlankBoard(8, 14);
    // board = createBlankBoard(12, 21);
  }
  return {
    name: name,
    designer: designer,
    created: getFormatedDate(),
    board: board,
  };
}

function getFormatedDate() {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
  const yyyy = date.getFullYear();

  return mm + '/' + dd + '/' + yyyy;
}

function createBlankBoard(w, h) {
  const board = new Array(h);
  for (let i = 0; i < h; i++) {
    board[i] = new Array(w).fill(0);
  }
  return board;
}

// ========================
// LOADING LOCAL LEVEL DATA

export async function importStoredLevels() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    levels = [...defaults];

    const settings = [
      "isAppDarkMode",
      "appDragSensitivity",
      "appDoubleTapDelay",
      "appTheme",
      "appAudioMode"
    ];

    for (let i = 0; i < keys.length; i++) {
      if (settings.includes(keys[i])) {
        continue;
      } else {
        const level = await getData(keys[i]);
        levels.push(level);
      }
    }
  } catch (err) {
    console.log("\n\n(ERROR) >>> IMPORTING ERROR:\n", err);
  }
}

async function getData(storage_key) {
  try {
    const jsonValue = await AsyncStorage.getItem(storage_key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (err) {
    console.log("\n\n(ERROR) >>> READING ERROR:\n", err);
  }
}

importStoredLevels();

// END LOADING LOCAL DATA
// ======================

// This can't just be a dictionary since graphics changes.
export function icon_src(type) {
  if (type === "door") { return graphics.DOOR; }
  if (type === "key") { return graphics.KEY; }
  if (type === "crate") { return graphics.CRATE; }
  if (type === "crater") { return graphics.CRATER; }
  if (type === "coin") { return graphics.COIN; }
  if (type === "flag") { return graphics.FLAG; }
  if (type === "bomb") { return graphics.BOMB; }
  if (type === "explosion") { return graphics.EXPLOSION; }
  // For level creation:
  if (type === "spawn") { return graphics.PLAYER; }
}

export function calcTileSize(boardWidth, boardHeight, window) {
  const maxWidth = (window.width * 0.9) / boardWidth;
  const maxHeight = (window.height * 0.8) / boardHeight;
  return Math.min(maxWidth, maxHeight);
}

export function getTileType(tile) {
  if (typeof tile === "string") {
    return "bomb";
  } else {
    return tiles[tile];
  }
}

export function getTileEntityData(tile) {
  // Ignore regular tiles, only process tile entities.
  if (typeof tile === "string") {
    const data = tile.split(":");

    // BOMB
    if (data[0] === "b") {
      return {
        type: "bomb",
        fuse: tile.split(":")[1]
      };
    }

    // Future tile entities can go here!
  }
  return {
    type: null,
  };
}

export function formatTileEntityData(data) {
  if (data.type = "bomb") {
    return `b:${data.fuse}`;
  }
}

export const tiles = {
  0: "empty",
  1: "wall",
  2: "door",
  3: "key",
  4: "crate",
  5: "crater",
  6: "coin",
  7: "spawn",
  8: "flag",
  9: "explosion",
}

export const identifier = {
  "empty": 0,
  "wall": 1,
  "door": 2,
  "key": 3,
  "crate": 4,
  "crater": 5,
  "coin": 6,
  "spawn": 7,
  "flag": 8,
  "explosion": 9,
  // "bomb": null, // bomb doesn't use number id
}

export function validTile(yPos, xPos, board) {
  return (yPos >= 0 && yPos < board.length && xPos >= 0 && xPos < board[0].length);
}

// Player can move to this tile without changing anything about 
// the game state (other than player position).
function canWalkNoDisturb(yPos, xPos, game) {
  if (validTile(yPos, xPos, game.board)) {
    return (["empty", "spawn"].includes(tileAt(yPos, xPos, game.board))) ||
      (tileAt(yPos, xPos, game.board) === "flag" && game.coins === game.maxCoins);
  }
  return false;
}

export function canWalk(yPos, xPos, game) {
  if (validTile(yPos, xPos, game.board)) {
    return (["empty", "spawn", "coin", "key"].includes(tileAt(yPos, xPos, game.board))) ||
      (tileAt(yPos, xPos, game.board) === "flag" && game.coins === game.maxCoins);
  }
  return false;
}

export function tileAt(yPos, xPos, board) {
  if (validTile(yPos, xPos, board)) {
    return getTileType(board[yPos][xPos]);
  }
  return "outside"; // outside of board
}

/**
 * Returns the player spawn position in the given level.
 * @param {number[][]} board The board[][] you wish to search. 
 * @returns Returns of the form {y: number, x: number}
 */
export function getSpawnPos(board) {
  const dimensions = [board.length, board[0].length];

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (tiles[board[i][j]] === "spawn") {
        return { y: i, x: j };
      }
    }
  }
  return { y: NaN, x: NaN };
}

/**
 * Returns the number of time some value shows up in an array.
 * @param {Array} array The array to count in.
 * @param {number} val A number since that is how level data is stored.
 * @returns {number} The count.
 */
function countTimesInArray(array, val) {
  const dimensions = [array.length, array[0].length];
  let count = 0;
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (array[i][j] === val) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Checks if the destination position can be reached from the current position
 * walking only on empty spaces or the flag if enough coins have been collected. 
 * If there is no such path, returns false. If there is, returns a list of string
 * instructions for reaching the destination.
 * 
 * @param {GameObj} game_obj The current game state object, used for player position and board state
 * @param {number} tileX The X index of the destination tile 
 * @param {number} tileY The Y index of the destination tile
 * @returns {(boolean|Array)} Either false or a list of strings
 */
export function canMoveTo(game_obj, tileX, tileY) {
  if (!canWalk(tileY, tileX, game_obj)) {
    return false;
  }

  const visited = [];
  const queue = new Queue();
  queue.enqueue({ x: game_obj.player.x, y: game_obj.player.y, path: [] });

  while (!queue.isEmpty) {
    const current = queue.dequeue();

    if (!canWalk(current.y, current.x, game_obj)) {
      continue;
    }
    if (visited.includes(`${current.y},${current.x}`)) {
      continue;
    }
    
    visited.push(`${current.y},${current.x}`);
    if (tileX === current.x && tileY === current.y) {
      return current.path;
    } else {
      queue.enqueue({ x: current.x + 1, y: current.y, path: current.path.concat("right") });
      queue.enqueue({ x: current.x - 1, y: current.y, path: current.path.concat("left") });
      queue.enqueue({ x: current.x, y: current.y + 1, path: current.path.concat("down") });
      queue.enqueue({ x: current.x, y: current.y - 1, path: current.path.concat("up") });
    }

  }

  return false;
}

export function doGameMove(game_obj, move) {
  const next = cloneGameObj(game_obj); // The next game object following this game move.
  const move_to = { y: game_obj.player.y, x: game_obj.player.x }; // Where the player is attempting to move.
  const one_further = { y: game_obj.player.y, x: game_obj.player.x }; // One tile further that that in the same direction.

  if (move === "up") {
    move_to.y -= 1;
    one_further.y -= 2;
  } else if (move === "down") {
    move_to.y += 1;
    one_further.y += 2;
  } else if (move === "left") {
    move_to.x -= 1;
    one_further.x -= 2;
  } else if (move === "right") {
    move_to.x += 1;
    one_further.x += 2;
  }

  // Clear explosion tiles.
  const dimensions = [next.board.length, next.board[0].length];
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (tileAt(i, j, next.board) === "explosion") {
        next.board[i][j] = 0;
      }
    }
  }

  // The basic structure of how this seciton works is that if the move_to position is
  // on some tile that could be walked on after some game logic (e.g. a coin tile or 
  // door when keys > 0) then we do that logic and clear the tile. At the end of all the
  // logic, we run attemptMove which only succeeds and moves the player if move_to is now
  // empty (e.g. the coin tile was collected & cleared or the door was opened & cleared)

  // If we walked onto a collectable, add it to the inventory
  // and clear the tile on the new board object.
  if (tileAt(move_to.y, move_to.x, next.board) === "coin") {
    next.coins += 1;
    next.board[move_to.y][move_to.x] = 0;
  }
  if (tileAt(move_to.y, move_to.x, next.board) === "key") {
    next.keys += 1;
    next.board[move_to.y][move_to.x] = 0;
  }

  // If we walked into a door and have the means to open it, do so.
  if (game_obj.keys > 0 && tileAt(move_to.y, move_to.x, next.board) === "door") {
    next.keys -= 1;
    next.board[move_to.y][move_to.x] = 0;
  }

  // Pushing a crate onto an empty tile.
  if (tileAt(move_to.y, move_to.x, next.board) === "crate" &&
    tileAt(one_further.y, one_further.x, next.board) === "empty") {
    next.board[move_to.y][move_to.x] = 0;
    next.board[one_further.y][one_further.x] = identifier["crate"];
  }

  // Pushing a crate into a crater.
  if (tileAt(move_to.y, move_to.x, next.board) === "crate" &&
    tileAt(one_further.y, one_further.x, next.board) === "crater") {
    next.board[move_to.y][move_to.x] = 0;
    next.board[one_further.y][one_further.x] = 0;
  }

  // Pushing a bomb onto an empty tile.
  if (tileAt(move_to.y, move_to.x, next.board) === "bomb" &&
    tileAt(one_further.y, one_further.x, next.board) === "empty") {
    next.board[move_to.y][move_to.x] = 0;
    // We don't just set using indentifier["bomb"] since bomb is a string
    // so that it can contain fuse time. We need to persist this data.
    next.board[one_further.y][one_further.x] = game_obj.board[move_to.y][move_to.x];
  }

  // Tile entity logic handling.
  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      const data = getTileEntityData(next.board[i][j]);

      if (data.type === "bomb") {
        data.fuse--;

        if (data.fuse > 0) {
          const updated = formatTileEntityData(data);
          next.board[i][j] = updated;
        } else {
          if (tileAt(i - 1, j, next.board) === "crate") { next.board[i - 1][j] = 0; }
          if (tileAt(i + 1, j, next.board) === "crate") { next.board[i + 1][j] = 0; }
          if (tileAt(i, j - 1, next.board) === "crate") { next.board[i][j - 1] = 0; }
          if (tileAt(i, j + 1, next.board) === "crate") { next.board[i][j + 1] = 0; }
          next.board[i][j] = 9;
        }
      }
    }
  }

  next.won = attemptMove(move_to.y, move_to.x, next);
  return next;
}

function attemptMove(yPos, xPos, next) {
  if (canWalkNoDisturb(yPos, xPos, next)) {
    next.player.x = xPos;
    next.player.y = yPos;
    return winCondition(next);
  }
  return false;
}

function winCondition(next) {
  return tileAt(next.player.y, next.player.x, next.board) === "flag" && (next.coins === next.maxCoins);
}

/**
 * @typedef {Object} GameObj
 * @property {number[][]} board - The current board state with tile numbers encoding their content
 * @property {{x: number, y: number}} player - Object contianing player position
 * @property {number} maxCoins - The number of coins needed to complete the level
 * @property {number} coins - The number of coins collected so far
 * @property {number} keys - The number of keys collected and not used
 * @property {boolean} won - Whether the level has been beaten yet
 */

/**
 * Creates a new game object for the given level. Game objects
 * contain the board, player position, and number of coins in the level.
 * @param {number} level_id The level to be cloned for the initial board.
 * @returns {GameObj} A GameObj properly set for game start.
 */
export function initializeGameObj(level_id) {
  const level = cloneBoard(levels[level_id].board);
  const numberOfCoins = countTimesInArray(level, identifier["coin"]);
  const startPos = getSpawnPos(level);
  level[startPos.y][startPos.x] = 0;

  return {
    board: level,
    player: startPos,
    maxCoins: numberOfCoins,
    coins: 0,
    keys: 0,
    won: false,
  };
}

// Deep copy of a game object.
function cloneGameObj(game_obj) {
  return {
    board: cloneBoard(game_obj.board),
    player: { y: game_obj.player.y, x: game_obj.player.x },
    maxCoins: game_obj.maxCoins,
    coins: game_obj.coins,
    keys: game_obj.keys,
    won: game_obj.won,
  };
}

export function cloneBoard(board) {
  const newBoard = [];
  for (let i = 0; i < board.length; i++) {
    newBoard[i] = [...board[i]];
  }
  return newBoard;
}