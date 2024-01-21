import { Board, BoardTile, BombTile, Level, OfficialLevel, OneWayTile, TileType, UserLevel } from "./types";
import { defaultSettings } from "../GlobalContext";
import { eventEmitter } from "./events";
import { MMKV } from "react-native-mmkv";
import { countInstancesInBoard } from "./logic";

export const storage = new MMKV();
const settingsKeys = Object.keys(defaultSettings);

export enum metadataKeys {
  lastUpdatedOfficialLevels = "lastUpdatedOfficialLevels",
  officialLevelKeys = "officialLevelKeys",
  customLevelKeys = "customLevelKeys",
  coinBalance = "coinBalance",
}

export function getSavedSettings() {
  const savedValues = multiGetData(settingsKeys);
  const settings = { ...defaultSettings, ...savedValues };
  return settings;
}

export function getStoredLevels() {
  const olKeys: string[] = getData(metadataKeys.officialLevelKeys) || [];
  const clKeys: string[] = getData(metadataKeys.customLevelKeys) || [];
  const keys = [...olKeys, ...clKeys];

  const levels: Level[] = [];
  keys.forEach(key => {
    const level = getData(key) as Level;
    levels.push(level);
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

export function markLevelCompleted(uuid: string) {
  const level = getData(uuid) as Level;
  level.completed = true;
  setData(uuid, level);
  eventEmitter.emit("doStateStorageSync", { detail: uuid });

  const gain = countInstancesInBoard(level.board, TileType.COIN);
  modifyCoinBalance(gain);
}

function modifyCoinBalance(change: number) {
  const balance = getData(metadataKeys.coinBalance) || 0;
  setData(metadataKeys.coinBalance, balance + change);
  console.log("Updated balance to", balance, "+", change, "=", balance + change);
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
        // make sure that this is a guarantee and not environemtn dependent.
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

// const allLevels: Board[] = [ // 8 x 14
//   [
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//   ],
//   [
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 1 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 3 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 2 }, { id: 0 }, { id: 8 }, { id: 0 }],
//     [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//   ],
//   [
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 6 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 3 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//   ],
//   [
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 4 }, { id: 7 }, { id: 9, fuse: 25 }, { id: 5 }, { id: 0 }],
//     [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 3 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 12, orientation: 0 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 1 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 3 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 4 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 5 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }],
//     [{ id: 8 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 0 }],
//     [{ id: 1 }, { id: 1 }, { id: 5 }, { id: 7 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 5 }],
//     [{ id: 1 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 5 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 1 }, { id: 4 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 3 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 3 }, { id: 5 }],
//     [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }],
//     [{ id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 6 }, { id: 5 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 8 }, { id: 1 }, { id: 5 }, { id: 4 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 6 }],
//     [{ id: 6 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 8 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 3 }, { id: 0 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 4 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 4 }],
//     [{ id: 0 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }],
//     [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 8 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 6 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }],
//     [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 6 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 3 }],
//     [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 6 }],
//   ],
//   [
//     [{ id: 3 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 3 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 2 }],
//     [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 8 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 5 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }],
//     [{ id: 5 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 6 }, { id: 1 }, { id: 3 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 8 }, { id: 5 }],
//     [{ id: 1 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 1 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }],
//     [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 1 }, { id: 3 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }],
//     [{ id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 4 }],
//     [{ id: 2 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }],
//     [{ id: 0 }, { id: 1 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }],
//     [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 6 }, { id: 4 }, { id: 5 }, { id: 3 }, { id: 0 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 4 }],
//   ],
//   [
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 6 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 6 }, { id: 0 }, { id: 4 }, { id: 5 }],
//     [{ id: 4 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
//     [{ id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
//     [{ id: 0 }, { id: 2 }, { id: 1 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 6 }],
//     [{ id: 4 }, { id: 0 }, { id: 8 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 2 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
//     [{ id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
//     [{ id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 4 }],
//   ],
//   [
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }, { id: 5 }, { id: 3 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 9, fuse: 35 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 0 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }],
//     [{ id: 6 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }],
//     [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 7 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 8 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
//   ],
//   [
//     [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 4 }],
//     [{ id: 5 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 8 }],
//     [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 0 }],
//     [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 40 }, { id: 1 }],
//     [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 2 }, { id: 6 }],
//   ],
//   [
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 6 }],
//     [{ id: 4 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }],
//     [{ id: 12, orientation: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }],
//     [{ id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
//     [{ id: 0 }, { id: 2 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 4 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 2 }],
//     [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 5 }],
//     [{ id: 5 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 4 }],
//     [{ id: 5 }, { id: 8 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 1 }, { id: 0 }, { id: 3 }],
//   ],
//   [
//     [{ id: 0 }, { id: 5 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
//     [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 8 }, { id: 1 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 4 }, { id: 12, orientation: 3 }, { id: 7 }, { id: 0 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 0 }],
//     [{ id: 12, orientation: 2 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 6 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 5 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 6 }, { id: 2 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 6 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }],
//   ],
//   [
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 1 }],
//     [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 2 }],
//     [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 5 }],
//     [{ id: 12, orientation: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }],
//     [{ id: 6 }, { id: 12, orientation: 1 }, { id: 0 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 5 }, { id: 5 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }],
//     [{ id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }],
//     [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 3 }],
//     [{ id: 5 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
//   ],
//   [
//     [{ id: 8 }, { id: 0 }, { id: 2 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 12, orientation: 1 }, { id: 6 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 2 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 3 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }],
//     [{ id: 12, orientation: 2 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 1 }],
//     [{ id: 1 }, { id: 12, orientation: 0 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 12, orientation: 0 }, { id: 1 }],
//     [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }],
//     [{ id: 6 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 9, fuse: 20 }, { id: 6 }],
//     [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 5 }],
//     [{ id: 6 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }],
//   ],
//   [
//     [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 4 }],
//     [{ id: 5 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 8 }],
//     [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 1 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 0 }],
//     [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }],
//     [{ id: 4 }, { id: 0 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 41 }, { id: 1 }],
//     [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 2 }, { id: 6 }],
//   ],
//   [
//     [{ id: 1 }, { id: 6 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 5 }, { id: 4 }, { id: 0 }, { id: 3 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 4 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
//     [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 8 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }],
//     [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 4 }],
//     [{ id: 5 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
//     [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }],
//     [{ id: 4 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }],
//     [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 5 }, { id: 1 }, { id: 0 }],
//     [{ id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 3 }, { id: 0 }, { id: 4 }, { id: 0 }],
//     [{ id: 1 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 5 }, { id: 6 }],
//   ],
//   [
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 12, orientation: 3 }],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 6 }],
//     [{ id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 1 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 0 }],
//     [{ id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 35 }, { id: 2 }],
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 12, orientation: 3 }, { id: 7 }, { id: 6 }],
//     [{ id: 8 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }],
//     [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }],
//     [{ id: 1 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 4 }],
//     [{ id: 12, orientation: 1 }, { id: 9, fuse: 95 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
//     [{ id: 0 }, { id: 6 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 0 }, { id: 5 }],
//     [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 5 }, { id: 3 }],
//   ],
//   [
//     [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 12, orientation: 3 },],
//     [{ id: 4 }, { id: 1 }, { id: 6 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 4 }, { id: 5 },],
//     [{ id: 5 }, { id: 3 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 12, orientation: 1 }, { id: 0 },],
//     [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 4 },],
//     [{ id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 1 }, { id: 6 },],
//     [{ id: 6 }, { id: 8 }, { id: 5 }, { id: 9, fuse: 25 }, { id: 5 }, { id: 2 }, { id: 9, fuse: 75 }, { id: 5 },],
//     [{ id: 2 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 },],
//     [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 5 }, { id: 12, orientation: 3 }, { id: 9, fuse: 5 }, { id: 4 },],
//     [{ id: 5 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 3 }, { id: 9, fuse: 50 }, { id: 2 }, { id: 4 },],
//     [{ id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 12, orientation: 3 },],
//     [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 },],
//     [{ id: 3 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 6 },],
//     [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 4 },],
//     [{ id: 5 }, { id: 4 }, { id: 9, fuse: 10 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 },],
//   ],
// ];

// const allNames = [
//   "Blank Canvas",
//   "Tutorial",
//   "Easy Peasy",
//   "Having a Blast",
//   "Rooms",
//   "Choices",
//   "Running Laps",
//   "The Hallway",
//   "Trickster",
//   "Bust the Wall?",
//   "Deja Vu",
//   "Race the Clock",
//   "Marathon",
//   "No Way Home",
//   "Prison",
//   "The Wall",
//   "Buzzer Beater",
//   "Stupid Door",
//   "Pain",
//   "Doubling Up",
//   "Warzone",
// ]

// let i = 0;
// allLevels.forEach(lvl => {
//   console.log(`\n\n${i}: ${allNames[i]}\n`);
//   console.log(compressBoardData(lvl) + "[END]");
//   i++;
// });

// LEVEL IDEAS:
// Pesky Coin (coins blocking crates)
// Key Chain (tons of keys & doors)
// Potholes (lots of craters)
// Demolition Man (no craters only bombs)
// Payday (tons of coins)