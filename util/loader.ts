import { Board, BoardTile, BombTile, Level, OfficialLevel, OneWayTile, TileType, UserLevel, isLevelWellFormed } from "./types";
import { countInstancesInBoard } from "./logic";
import { eventEmitter } from "./events";
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

export enum metadataKeys {
  lastUpdatedOfficialLevels = "lastUpdatedOfficialLevels",
  officialLevelKeys = "officialLevelKeys",
  customLevelKeys = "customLevelKeys",
  coinBalance = "coinBalance",
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
    if (isLevelWellFormed(level)) {
      levels.push(level);
    } else {
      // TODO: If the level is malformed, then the key needs to be deleted.
      console.warn("Malformed level detected for key: ", key);
    }
  });

  levels.sort((a, b) => {
    if (!Object.hasOwn(a, "order") || !Object.hasOwn(b, "order")) return 0;
    else return (a as OfficialLevel).order - (b as OfficialLevel).order;
  });

  return levels;
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

export function createLevel(level: UserLevel) {
  setData(level.uuid, level);
  // TODO: Create standard function with error handling for adding a value to a local storage list.
  const customLevelKeys = getData(metadataKeys.customLevelKeys) || [];
  customLevelKeys.push(level.uuid);
  setData(metadataKeys.customLevelKeys, customLevelKeys);
  eventEmitter.emit("doStateStorageSync", { detail: level.uuid });
}

export function updateLevel(updatedLevel: UserLevel) {
  const existingLevel: Level = getData(updatedLevel.uuid);

  if (!existingLevel) {
    console.error("Attempted to update non-existent level: " + updatedLevel.uuid);
    return;
  }

  const level: Level = {
    ...existingLevel,
    ...updatedLevel,
    completed: false,
  };

  setData(level.uuid, level);
  eventEmitter.emit("doStateStorageSync", { detail: level.uuid });
}

export function deleteLevel(level: UserLevel) {
  storage.delete(level.uuid);
  const customLevelKeys: string[] = getData(metadataKeys.customLevelKeys) || [];
  const levelIndex = customLevelKeys.findIndex(key => key === level.uuid);
  
  if (levelIndex !== -1) {
    customLevelKeys.splice(levelIndex, 1);
    setData(metadataKeys.customLevelKeys, customLevelKeys);
  } else {
    console.error(`Attempted delete of level with uuid ${level.uuid} but no corresponding key was found in "metadataKeys.customLevelKeys"!`)
  }
  
  eventEmitter.emit("doStateStorageSync");
}

export function multiStoreLevels(levels: Level[]) {
  const keys = JSON.stringify(levels.map(level => level.uuid));

  try {
    levels.forEach(level => {
      storage.set(level.uuid, JSON.stringify(level));
    });
    storage.set(metadataKeys.officialLevelKeys, keys);
    return true;
  } catch (err) {
    console.error("Error completing multiStoreLevels command:", err);
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

export function markLevelCompleted(uuid: string, moveCount: number) {
  const level = getData(uuid) as Level;
  const wasCompleted = level.completed;

  const prevBest = Number.isInteger(level.best) ? level.best : Infinity;
  level.best = Math.min(prevBest!, moveCount);
  level.completed = true;
  setData(uuid, level);
  eventEmitter.emit("doStateStorageSync", { detail: uuid });

  if (level.official && !wasCompleted) {
    // We only want to give coins for the first time an official level is completed.
    const gain = countInstancesInBoard(level.board, TileType.COIN);
    modifyCoinBalance(gain);
  }
}

function modifyCoinBalance(change: number) {
  const balance = getData(metadataKeys.coinBalance) || 0;
  setData(metadataKeys.coinBalance, balance + change);
  // console.log("Updated balance to", balance, "+", change, "=", balance + change);
}

export function useCoinBalance() {
  const balance = getData(metadataKeys.coinBalance) || 0;
  return [balance, modifyCoinBalance];
}

const split = {
  row: "/",
  column: ",",
  tile: ".",
}

export function parseCompressedBoardData(raw: string): Board {
  const rawBoard = raw.split(split.row);
  const board: Board = [];

  rawBoard.forEach(strRow => {
    const rawRow = strRow.split(split.column);
    const row: BoardTile[] = [];

    rawRow.forEach(strTile => {
      if (strTile.includes(split.tile)) {
        const tileData = strTile.split(split.tile).map(substr => parseInt(substr));
        const tile = { id: tileData[0] };

        // TODO: As the list of tiles with data beyond id expands,
        // this code would become less maintainable, so it needs to
        // be refactored.

        if (tile.id === TileType.ONEWAY) {
          (tile as OneWayTile).orientation = tileData[1];
        }
        if (tile.id === TileType.BOMB) {
          (tile as BombTile).fuse = tileData[1];
        }

        row.push(tile);
      } else {
        row.push({ id: parseInt(strTile) });
      }
    });

    board.push(row);
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
export function compressBoardData(board: Board): string {
  let result = "";

  for (let y = 0; y < board.length; y++) {
    let row = "";

    for (let x = 0; x < board[0].length; x++) {
      const tile = board[y][x];
      const keys = Object.keys(tile);

      let encoding = "";
      keys.forEach(key => {
        // TODO: These seem to always be in the right order, but need to
        // make sure that this is a guarantee and not environment dependent.
        encoding += tile[key as keyof BoardTile].toString() + split.tile;
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
  return (new Date().getTime().toString() + Math.random()).replace(".", "");
}

// LEVEL IDEAS:
// Pesky Coin (coins blocking crates)
// Key Chain (tons of keys & doors)
// Potholes (lots of craters)
// Demolition Man (no craters only bombs)
// Payday (tons of coins)