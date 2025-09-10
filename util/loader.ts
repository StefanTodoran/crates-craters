import { MMKV } from "react-native-mmkv";
import { FlatBoard } from "./board";
import { doNotificationsUpdate, doStateStorageSync } from "./events";
import { countInstancesInBoard } from "./logic";
import { BombTile, Direction, Level, LevelObjectType, LocalUserData, OfficialLevel, OneWayTile, TileType, UserLevel, isLevelWellFormed } from "./types";

export const storage = new MMKV();

export enum metadataKeys {
  lastUpdatedOfficialLevels = "lastUpdatedOfficialLevels",
  lastDataVersionCode = "lastDataVersionCode",
  officialLevelKeys = "officialLevelKeys",
  customLevelKeys = "customLevelKeys",
  coinBalance = "coinBalance",
  userCredentials = "userCredentials",
  userData = "userData",

  // These reference the UUIDs of publicly shared user created levels.
  likedLevels = "likedLevels",
  attemptedLevels = "attemptedLevels",
  completedLevels = "completedLevels",
}

export function setData(key: string, value: any) {
  const jsonValue = JSON.stringify(value);
  try {
    storage.set(key, jsonValue);
    return true;
  } catch (err) {
    console.error("Error completing setData command:", err);
    return false;
  }
}

export function getData(key: string) {
  let rawValue;
  try {
    rawValue = storage.getString(key);
  } catch (err) {
    console.error("Error completing getData command:", err);
    return undefined;
  }

  return rawValue ? JSON.parse(rawValue) : undefined;
}

export function getLevelData(key: string) {
  const level = getData(key);
  const board = new FlatBoard(level.board.board);
  level.board = board;
  return level as Level;
}

export function getLocalUserData() {
  const userData: LocalUserData = getData(metadataKeys.userData);
  if (!userData) {
    const newUserData: LocalUserData = {
      uuid: generateUUID(),
      joined: new Date().toISOString(),
      // TODO: Maybe add "expo-device" package to get device info.
    }
    setData(metadataKeys.userData, newUserData);
    return newUserData;
  }

  return userData;
}

export function multiGetData(keys: string[]) {
  let rawValues: any[];
  try {
    rawValues = keys.map(key => storage.getString(key));
  } catch (err) {
    console.error("Error completing multiGetData command:", err);
    return {};
  }

  const parsedData: { [key: string]: any } = {};
  keys.forEach((key, idx) => {
    if (rawValues[idx]) {
      parsedData[key] = JSON.parse(rawValues[idx]);
    }
  });

  return parsedData;
}

export function getStoredLevelCount() {
  const olKeys: string[] = getData(metadataKeys.officialLevelKeys) || [];
  return olKeys.length;
}

export function getStoredLevels() {
  const olKeys: string[] = getData(metadataKeys.officialLevelKeys) || [];
  const clKeys: string[] = getData(metadataKeys.customLevelKeys) || [];
  const keys = [...olKeys, ...clKeys];

  const levels: Level[] = [];
  keys.forEach(key => {
    const level = getData(key);
    const expectedType = olKeys.includes(key) ? LevelObjectType.OFFICIAL : LevelObjectType.USER;

    if (isLevelWellFormed(level, expectedType)) {
      // @ts-expect-error The next two lines turn level.board from an object to a class instance.
      const board = new FlatBoard(level.board.board);
      level.board = board;

      levels.push(level);
    } else {
      // TODO: If the level is malformed, then the key needs to be deleted.
      console.warn("Malformed level detected for key: ", key);
      // deleteLevel(level, olKeys.includes(key) ? metadataKeys.officialLevelKeys : metadataKeys.customLevelKeys);
      // levels.splice(levels.findIndex(level => level.uuid === key), 1);
    }
  });

  levels.sort((a, b) => {
    if (!Object.hasOwn(a, "order") || !Object.hasOwn(b, "order")) return 0;
    else return (a as OfficialLevel).order - (b as OfficialLevel).order;
  });

  return levels;
}

export function createLevel(level: UserLevel) {
  setData(level.uuid, level);
  // TODO: Create standard function with error handling for adding a value to a local storage list.
  const customLevelKeys = getData(metadataKeys.customLevelKeys) || [];
  customLevelKeys.push(level.uuid);
  setData(metadataKeys.customLevelKeys, customLevelKeys);

  // TODO: All state storage sync functions could maybe be replaced with
  // a number of event listeners on MMKV.
  doStateStorageSync(level.uuid);
}

export function updateLevel(updatedLevel: UserLevel, boardChange: boolean = true) {
  const existingLevel: Level = getData(updatedLevel.uuid);

  if (!existingLevel) {
    console.error("Attempted to update non-existent level: " + updatedLevel.uuid);
    return;
  }

  const level: Level = {
    ...existingLevel,
    ...updatedLevel,
  };

  if (boardChange) {
    level.completed = false;
    level.bestSolution = undefined;
  }

  setData(level.uuid, level);
  doStateStorageSync(level.uuid);
}

export function deleteLevel(level: Level, keySet: metadataKeys = metadataKeys.customLevelKeys) {
  storage.delete(level.uuid);
  const keys: string[] = getData(keySet) || [];
  const levelIndex = keys.findIndex(key => key === level.uuid);

  if (levelIndex !== -1) {
    keys.splice(levelIndex, 1);
    setData(keySet, keys);
  } else {
    console.error(`Attempted delete of level with uuid ${level.uuid} but no corresponding key was found in "${keySet}"!`)
  }

  doStateStorageSync();
}

export function multiStoreLevels(levels: Level[]) {
  const keys = levels.map(level => level.uuid);

  try {
    levels.forEach(level => {
      storage.set(level.uuid, JSON.stringify(level));
    });
    storage.set(metadataKeys.officialLevelKeys, JSON.stringify(keys));
  } catch (err) {
    console.error("Error completing multiStoreLevels command:", err);
    return false;
  }

  const storedKeys = storage.getAllKeys();
  const missingKeys = keys.filter(key => !storedKeys.includes(key));
  if (missingKeys.length > 0) {
    console.error("Missing keys after multiStoreLevels command:", missingKeys);
    return false;
  }

  return true;
}

export function markLevelCompleted(uuid: string, moveHistory: Direction[]) {
  const level = getLevelData(uuid);
  const wasCompleted = level.completed;

  const prevBest = level.bestSolution ? level.bestSolution.length : Infinity;
  if (moveHistory.length < prevBest) level.bestSolution = moveHistory.join("");
  level.completed = true;

  setData(uuid, level);
  doStateStorageSync(uuid);

  if (level.official && !wasCompleted) {
    // We only want to give coins for the first time an official level is completed.
    const gain = countInstancesInBoard(level.board, TileType.COIN);
    modifyCoinBalance(gain);
    doNotificationsUpdate(2, 1);
  }
}

function modifyCoinBalance(change: number) {
  const balance = getData(metadataKeys.coinBalance) || 0;
  setData(metadataKeys.coinBalance, balance + change);
}

export function useCoinBalance() {
  const balance = getData(metadataKeys.coinBalance) || 0;
  return {balance, modifyCoinBalance};
}

const split = {
  row: "/",
  column: ",",
  tile: ".",
}

export function parseCompressedBoardData(raw: string): FlatBoard {
  const rawBoard = raw.split(split.row);
  const board = new FlatBoard(FlatBoard.createEmptyBoard());

  rawBoard.forEach((strRow, yPos) => {
    const rawRow = strRow.split(split.column);

    rawRow.forEach((strTile, xPos) => {
      if (strTile.includes(split.tile)) {
        const tileData = strTile.split(split.tile).map(substr => parseInt(substr));
        const tile = { id: tileData[0] };

        // TODO: As the list of tiles with data beyond id expands,
        // this code would become less maintainable, so it needs to
        // be refactored.

        if (tile.id === TileType.ONEWAY) {
          (tile as OneWayTile).blocked = tileData.slice(1);
        }
        if (tile.id === TileType.BOMB) {
          (tile as BombTile).fuse = tileData[1];
        }

        board.setTile(yPos, xPos, tile);
      } else {
        board.setTile(yPos, xPos, { id: parseInt(strTile) });
      }
    });
  });

  return board;
}

/**
 * @returns {string} A string representing board data. Each row is slash
 * separated, and tiles are comma separated. Each tile is either just an
 * integer id, or the id and other properties, separated by periods. Even
 * for packed levels, the compressed representation of a board will rarely
 * exceed 300 bytes.
 */
export function compressBoardData(board: FlatBoard): string {
  let result = "";

  for (let y = 0; y < board.height; y++) {
    let row = "";

    for (let x = 0; x < board.width; x++) {
      const tile = board.getTile(y, x);
      const keys = Object.keys(tile);

      let encoding = "";
      keys.forEach(key => {
        // TODO: These seem to always be in the right order, but need to
        // make sure that this is a guarantee and not environment dependent.

        // @ts-expect-error This is a valid key.
        const value = tile[key];

        let serializedValue = value.toString();
        if (value.constructor === Array) {
          serializedValue = value.join(".");
        }
        encoding += serializedValue + split.tile;
      });
      encoding = encoding.slice(0, -1);

      row += encoding + split.column;
    }

    row = row.slice(0, -1); // Remove trailing comma.
    row += split.row;
    result += row;
  }

  result = result.slice(0, -1); // Remove trailing slash.
  return result;
}

export function generateUUID() {
  return new Date().getTime().toString() + Math.random().toString(16).slice(2);
}

// LEVEL IDEAS:
// Pesky Coin (coins blocking crates)
// Key Chain (tons of keys & doors)
// Potholes (lots of craters)
// Demolition Man (no craters only bombs)
// Payday (tons of coins)