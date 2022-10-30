import door from './assets/door.png';
import key from './assets/key.png';
import crate from './assets/crate.png';
import crater from './assets/crater.png';
import coin from './assets/coin.png';
import flag from './assets/flag.png';

// Contains level data for the game as well
// as some helpful consts for dealing with that data.

const level_one = [
  [0,0,0,1,0,0,0,0],
  [0,8,0,2,5,0,4,0],
  [0,0,0,1,0,4,6,0],
  [1,1,1,1,0,0,5,0],
  [4,4,0,0,0,0,4,0],
  [6,5,0,0,0,4,0,0],
  [0,1,1,1,1,0,7,0],
  [0,0,3,1,6,0,0,0],
];
const level_two = [
  [0,0,2,0,1,1,1,3],
  [0,0,1,0,1,0,0,5],
  [8,0,1,0,2,0,4,0],
  [0,0,1,0,1,6,0,4],
  [1,1,1,0,1,1,1,1],
  [1,1,1,0,1,1,6,0],
  [1,1,0,4,5,1,1,0],
  [1,1,5,7,0,1,1,0],
  [1,3,4,4,4,0,1,0],
  [1,1,0,0,0,0,1,0],
  [1,1,4,4,0,0,1,0],
  [0,0,0,0,4,5,1,0],
  [1,1,1,1,2,1,1,0],
  [1,1,1,3,0,0,0,0],
];
const level_three = [
  [0,0,1,8,1,1,1,1],
  [0,6,1,2,1,0,6,0],
  [4,0,5,5,0,4,4,4],
  [0,0,1,0,1,0,0,0],
  [4,0,1,0,1,0,4,0],
  [0,4,1,0,1,0,5,4],
  [0,0,1,0,1,5,0,0],
  [0,0,4,7,4,0,0,0],
  [6,4,1,4,1,0,0,0],
  [1,1,1,0,1,1,1,1],
  [6,5,1,0,5,4,0,3],
  [4,0,0,0,4,0,4,0],
  [0,4,0,0,5,4,0,0],
  [0,0,4,0,4,0,4,6],
];
const level_four = [
  [3,0,5,0,0,1,6,3],
  [4,4,0,4,4,1,1,2],
  [4,0,4,0,0,0,0,5],
  [0,4,1,1,1,8,0,0],
  [4,0,1,6,1,1,1,0],
  [0,5,1,5,1,0,1,0],
  [0,0,2,7,0,0,0,0],
  [0,0,1,4,4,4,1,4],
  [0,0,1,0,0,0,1,0],
  [5,0,1,1,2,1,1,0],
  [0,6,1,0,0,1,0,0],
  [0,4,1,0,0,0,0,0],
  [0,0,1,1,6,1,3,4],
  [0,0,1,1,0,1,1,1],
];
const level_five = [
  [1,6,5,1,4,0,4,0],
  [5,4,0,3,5,0,4,4],
  [0,4,1,1,0,0,0,0],
  [0,4,2,0,0,1,0,4],
  [0,0,1,0,1,0,0,0],
  [8,0,5,4,0,0,5,5],
  [0,0,4,7,1,0,4,5],
  [1,5,1,2,1,0,4,4],
  [5,5,5,0,0,0,5,3],
  [0,0,5,1,0,1,0,1],
  [4,4,6,1,0,4,5,0],
  [0,4,1,1,5,5,1,0],
  [5,0,0,0,3,0,4,6],
];
const blank_level = [
  [7,0,0,0,0,0,0,6],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0],
];

// empty, key, coin, flag
export const walkables = [0,3,6,8];

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

export const icon_src = {
  "door": door,
  "key": key,
  "crate": crate,
  "crater": crater,
  "coin": coin,
  "flag": flag,
};

export const levels = [
  level_one,
  level_two,
  level_three,
  level_four,
  level_five,
  blank_level,
  blank_level,
  blank_level,
  blank_level,
];

/**
 * Returns the player spawn position in the given level.
 * @param {Array} level_id The level you wish to search. 
 * @returns Returns of the form {y: number, x: number}
 */
function getSpawnPos(level_id) {
  const level = levels[level_id];
  const dimensions = [ level.length, level[0].length ];

  for (let i = 0; i < dimensions[0]; i++) {
      for (let j = 0; j < dimensions[1]; j++) {
          if (tiles[level[i][j]] === "spawn") {
              return {y: i, x: j};
          }
      }
  }
  return {y: NaN, x: NaN};
}

function numberOfCoins(level_id) {
  const level = levels[level_id];
  return countTimesInArray(level, 6);
}

/**
 * Returns the number of time some value shows up in an array.
 * @param {Array} array The array to count in.
 * @param {number} val A number since that is how level data is stored.
 * @returns {number} The count.
 */
function countTimesInArray(array, val) {
  const dimensions = [ array.length, array[0].length ];
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

export function initializeGameObj(level_id) {
  return {
    board: levels[level_id],
    player: getSpawnPos(level_id),
    coins: numberOfCoins(level_id),
  };
}