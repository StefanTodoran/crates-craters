// Contains level data for the game as well
// as some helpful consts for dealing with that data.

const level_one = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 8, 0, 0, 6, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 2, 1],
  [0, 0, 0, 5, 0, 6, 0, 0],
  [6, 0, 0, 4, 4, 0, 3, 0],
  [0, 0, 0, 0, 4, 4, 0, 0],
  [1, 2, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 4, 5, 0, 0, 0],
  [0, 0, 0, 4, 5, 0, 3, 0],
  [0, 0, 0, 4, 5, 0, 0, 0],
  [1, 0, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 4, 0, 0, 0],
  [0, 6, 0, 0, 4, 0, 7, 0],
  [0, 0, 0, 0, 4, 0, 0, 0],
];
const level_two = [
  [0, 0, 0, 1, 0, 0, 1, 0],
  [0, 7, 0, 0, 4, 0, 8, 0],
  [0, 0, 0, 1, 0, 0, 1, 0],
  [0, 0, 0, 1, 3, 0, 1, 1],
  [0, 4, 4, 1, 5, 1, 0, 0],
  [0, 4, 0, 1, 0, 0, 0, 0],
  [4, 0, 0, 1, 0, 6, 0, 0],
  [1, 0, 1, 1, 0, 0, 5, 0],
  [0, 0, 0, 0, 0, 5, 4, 0],
  [0, 0, 0, 6, 0, 0, 0, 0],
  [1, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 5, 0, 0, 1, 1, 4],
  [0, 6, 5, 0, 0, 1, 6, 0],
  [6, 0, 1, 0, 0, 4, 0, 0],
];
const level_three = [
  [0, 0, 0, 6, 1, 0, 0, 0],
  [0, 4, 0, 1, 0, 0, 3, 5],
  [4, 0, 4, 1, 0, 4, 4, 0],
  [0, 0, 0, 1, 0, 4, 5, 0],
  [0, 6, 0, 1, 4, 4, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 5],
  [1, 1, 1, 1, 0, 0, 1, 0],
  [0, 0, 6, 5, 4, 1, 0, 0],
  [1, 1, 0, 4, 7, 4, 0, 0],
  [0, 0, 0, 0, 4, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 0, 0, 1, 8, 1, 5, 5],
  [4, 4, 0, 0, 1, 0, 0, 6],
  [6, 0, 5, 0, 0, 0, 0, 0],
];
const level_four = [
  [0, 0, 2, 0, 1, 1, 1, 3],
  [0, 0, 1, 0, 1, 0, 0, 5],
  [8, 0, 1, 0, 2, 0, 4, 0],
  [0, 0, 1, 0, 1, 6, 0, 4],
  [1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 6, 0, 0],
  [1, 1, 0, 4, 5, 1, 1, 0],
  [1, 1, 5, 7, 0, 1, 1, 5],
  [1, 3, 4, 4, 4, 0, 1, 0],
  [1, 1, 0, 0, 0, 0, 1, 0],
  [1, 1, 4, 4, 0, 0, 1, 0],
  [0, 0, 0, 0, 4, 5, 1, 4],
  [1, 1, 1, 1, 2, 1, 1, 0],
  [1, 1, 1, 3, 0, 0, 0, 0],
];
const level_five = [
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
const level_six = [
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
const level_seven = [
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
const blank_level = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 2, 0, 0, 0, 0],
  [5, 4, 0, 0, 0, 0, 0, 3],
  [4, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 3, 0, 0, 0, 0, 0],
  [0, 2, 0, 0, 0, 4, 0, 0],
  [8, 6, 7, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export const levels = [
  level_one,
  level_two,
  level_three,
  level_four,
  level_five,
  level_six,
  level_seven,
  blank_level,
  blank_level,
  blank_level,
  blank_level,
];

// empty, key, coin, flag
// export const walkables = [0,3,6,7,8];
export const walkables = [0, 7, 8];

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
};

export const indentifier = {
  "empty": 0,
  "wall": 1,
  "door": 2,
  "key": 3,
  "crate": 4,
  "crater": 5,
  "coin": 6,
  "spawn": 7,
  "flag": 8,
};

export function validTile(yPos, xPos, board) {
  return (yPos >= 0 && yPos < board.length && xPos >= 0 && xPos < board[0].length);
}

export function tileAt(yPos, xPos, board) {
  if (validTile(yPos, xPos, board)) {
    return tiles[board[yPos][xPos]];
  }
  return "outside"; // outside of board
}

import { graphics } from './Theme';
// This can't just be a dictionary since graphics changes.
export function icon_src(type) {
  if (type === "door") { return graphics.DOOR; }
  if (type === "key") { return graphics.KEY; }
  if (type === "crate") { return graphics.CRATE; }
  if (type === "crater") { return graphics.CRATER; }
  if (type === "coin") { return graphics.COIN; }
  if (type === "flag") { return graphics.FLAG; }
}


/**
 * Returns the player spawn position in the given level.
 * @param {Array} level_id The level you wish to search. 
 * @returns Returns of the form {y: number, x: number}
 */
function getSpawnPos(level_id) {
  const level = levels[level_id];
  const dimensions = [level.length, level[0].length];

  for (let i = 0; i < dimensions[0]; i++) {
    for (let j = 0; j < dimensions[1]; j++) {
      if (tiles[level[i][j]] === "spawn") {
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
    ["spawn", "empty"].includes(tileAt(one_further.y, one_further.x, next.board))) {
    next.board[move_to.y][move_to.x] = 0;
    next.board[one_further.y][one_further.x] = indentifier["crate"];
  }

  // Pushing a crate into a crater.
  if (tileAt(move_to.y, move_to.x, next.board) === "crate" &&
    tileAt(one_further.y, one_further.x, next.board) === "crater") {
    next.board[move_to.y][move_to.x] = 0;
    next.board[one_further.y][one_further.x] = 0;
  }

  next.won = attemptMove(move_to.y, move_to.x, next);
  return next;
}

function attemptMove(yPos, xPos, next) {
  if (validTile(yPos, xPos, next.board) && walkables.includes(next.board[yPos][xPos])) {
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
 * Creates a new game object for the given level. Game objects
 * contain the board, player position, and number of coins in the level.
 * @param {number} level_id The level to be cloned for the initial board.
 * @returns {GameObj}
 */
export function initializeGameObj(level_id) {
  const level = levels[level_id];
  const numberOfCoins = countTimesInArray(level, indentifier["coin"]);

  return {
    board: level,
    player: getSpawnPos(level_id),
    maxCoins: numberOfCoins,
    coins: 0, // coins collected so far
    keys: 0, // keys collected so far
    won: false,
  };
}

// Deep copy of a game object.
function cloneGameObj(game_obj) {
  const new_board = [];
  for (let i = 0; i < game_obj.board.length; i++) {
    new_board[i] = [...game_obj.board[i]];
  }

  return {
    board: new_board,
    player: { y: game_obj.player.y, x: game_obj.player.x },
    maxCoins: game_obj.maxCoins,
    coins: game_obj.coins,
    keys: game_obj.keys,
    won: game_obj.won,
  };
}