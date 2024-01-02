import AsyncStorage from "@react-native-async-storage/async-storage";
import { Board, BoardTile, BombTile, Level, OfficialLevel, OneWayTile, TileType, UserLevel } from "./types";
import { defaultSettings } from "../GlobalContext";

const settingsKeys = Object.keys(defaultSettings);

export enum metadataKeys {
  lastUpdatedOfficialLevels = "lastUpdatedOfficialLevels",
  officialLevelKeys = "officialLevelKeys",
  customLevelKeys = "customLevelKeys",
}

export async function debugDump() {
  // TODO: Remove this function!
  const keys = await AsyncStorage.getAllKeys();
  console.log("AsyncStorage keys:\n", keys, "\n");
  
  const items = await AsyncStorage.multiGet(keys);
  items.forEach(pair => console.log(`\n${pair[0]}:\n`, pair[1]));
}

export async function clearStorage() {
  // TODO: Remove this function!
  AsyncStorage.clear();
}

export async function getSavedSettings() {
  const savedValues = await multiGetData(settingsKeys);
  const settings = { ...defaultSettings, ...savedValues };
  return settings;
}

export async function importStoredLevels() {
  const olKeys: string[] = await getData(metadataKeys.officialLevelKeys) || [];
  const clKeys: string[] = await getData(metadataKeys.customLevelKeys) || [];
  const keys = [...olKeys, ...clKeys];

  const data = await multiGetData(keys);
  const levels: Level[] = [];

  Object.keys(data).forEach(key => {
    const value = data[key];
    levels.push(value);
  });

  levels.sort((a, b) => {
    if (!Object.hasOwn(a, "order") || !Object.hasOwn(b, "order")) return 0;
    else return (a as OfficialLevel).order - (b as OfficialLevel).order;
  });
  
  return levels;
}

export async function setData(key: string, value: any) {
  const jsonValue = JSON.stringify(value);
  try {
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (err) {
    console.error("Error saving to AsyncStorage:", err);
    return false;
  }
}

export async function createLevel(level: UserLevel) {
  setData(level.uuid, level);
  // TODO: Create standard function with error handling for adding a value to an AsyncStorage list.
  const customLevelKeys = (await getData(metadataKeys.customLevelKeys)) || [];
  customLevelKeys.push(level.uuid);
  setData(metadataKeys.customLevelKeys, customLevelKeys);
}

export async function updateLevel(updatedLevel: UserLevel) {
  const existingLevel: Level = await getData(updatedLevel.uuid);

  if (!existingLevel) {
    console.error("Attempted to update non-existent level: " + updatedLevel.uuid);
    return false;
  }

  const level: Level = {
    ...existingLevel,
    ...updatedLevel,
    completed: false,
  };

  return setData(level.uuid, level);
}

export async function multiStoreLevels(levels: Level[]) {
  const pairs: [string, string][] = levels.map(level => [level.uuid, JSON.stringify(level)]);
  const keys = JSON.stringify(levels.map(level => level.uuid));

  try {
    await AsyncStorage.multiSet(pairs);
    await AsyncStorage.setItem(metadataKeys.officialLevelKeys, keys)
    return true;
  } catch (err) {
    console.error("Error saving to AsyncStorage:", err);
    return false;
  }
}

export async function getData(key: string) {
  let rawValue;
  try {
    rawValue = await AsyncStorage.getItem(key);
  } catch (err) {
    console.error("Error reading from AsyncStorage:", err);
    return undefined;
  }

  return rawValue ? JSON.parse(rawValue) : undefined;
}

export async function multiGetData(keys: string[]) {
  let rawKVPairs;
  try {
    rawKVPairs = await AsyncStorage.multiGet(keys);
  } catch (err) {
    console.error("Error reading from AsyncStorage:", err);
    return {};
  }

  const parsedData: { [key: string]: any } = {};
  rawKVPairs.forEach(pair => {
    const parsedValue = pair[1] ? JSON.parse(pair[1]) : undefined;
    if (pair[1]) parsedData[pair[0]] = parsedValue;
  });

  return parsedData;
}

export async function markLevelCompleted(uuid: string) {
  const level = await getData(uuid) as Level;
  if (!level) return; // TODO: remove this, the case should not exit but we aren't storing levels to local storage yet!
  level.completed = true;
  setData(uuid, level);
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

const test: Board[] = [ // 8 x 14
  [
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
  ],
  [
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 1 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 3 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 2 }, { id: 0 }, { id: 8 }, { id: 0 }],
    [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
  ],
  [
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 6 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 3 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
  ],
  [
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 4 }, { id: 7 }, { id: 9, fuse: 25 }, { id: 5 }, { id: 0 }],
    [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 3 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 12, orientation: 0 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 1 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 3 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 4 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 5 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }],
    [{ id: 8 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 0 }],
    [{ id: 1 }, { id: 1 }, { id: 5 }, { id: 7 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 5 }],
    [{ id: 1 }, { id: 3 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 5 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 1 }, { id: 4 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 3 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 3 }, { id: 5 }],
    [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }],
    [{ id: 0 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 6 }, { id: 5 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 8 }, { id: 1 }, { id: 5 }, { id: 4 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 6 }],
    [{ id: 6 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 8 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 3 }, { id: 0 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 4 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 4 }],
    [{ id: 0 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }],
    [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 8 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 6 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }],
    [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 6 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 3 }],
    [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 6 }],
  ],
  [
    [{ id: 3 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 3 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 2 }],
    [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 8 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 5 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }],
    [{ id: 5 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 6 }, { id: 1 }, { id: 3 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 8 }, { id: 5 }],
    [{ id: 1 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 0 }, { id: 1 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 0 }],
    [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 1 }, { id: 3 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }],
    [{ id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 4 }],
    [{ id: 2 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }],
    [{ id: 0 }, { id: 1 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }],
    [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 6 }, { id: 4 }, { id: 5 }, { id: 3 }, { id: 0 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 4 }],
  ],
  [
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 6 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 6 }, { id: 0 }, { id: 4 }, { id: 5 }],
    [{ id: 4 }, { id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
    [{ id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
    [{ id: 0 }, { id: 2 }, { id: 1 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 6 }],
    [{ id: 4 }, { id: 0 }, { id: 8 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 2 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }],
    [{ id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
    [{ id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 4 }],
  ],
  [
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 0 }, { id: 5 }, { id: 3 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 9, fuse: 35 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 0 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }],
    [{ id: 6 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }],
    [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 7 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 8 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }],
  ],
  [
    [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 4 }],
    [{ id: 5 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 8 }],
    [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 0 }],
    [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 40 }, { id: 1 }],
    [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 2 }, { id: 6 }],
  ],
  [
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 6 }],
    [{ id: 4 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }],
    [{ id: 12, orientation: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 6 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }],
    [{ id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
    [{ id: 0 }, { id: 2 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 4 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 2 }],
    [{ id: 0 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 5 }],
    [{ id: 5 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 4 }],
    [{ id: 5 }, { id: 8 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 12, orientation: 1 }, { id: 0 }, { id: 3 }],
  ],
  [
    [{ id: 0 }, { id: 5 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 6 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }],
    [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 8 }, { id: 1 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 4 }, { id: 12, orientation: 3 }, { id: 7 }, { id: 0 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 0 }],
    [{ id: 12, orientation: 2 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 6 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 5 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 12, orientation: 3 }, { id: 0 }, { id: 6 }, { id: 2 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 6 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 12, orientation: 3 }, { id: 0 }],
  ],
  [
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 6 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 1 }],
    [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 7 }, { id: 0 }, { id: 0 }, { id: 2 }],
    [{ id: 4 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 5 }],
    [{ id: 12, orientation: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }],
    [{ id: 6 }, { id: 12, orientation: 1 }, { id: 0 }, { id: 0 }, { id: 8 }, { id: 0 }, { id: 5 }, { id: 5 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 5 }],
    [{ id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 6 }],
    [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 4 }, { id: 0 }, { id: 4 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 3 }],
    [{ id: 5 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }],
  ],
  [
    [{ id: 8 }, { id: 0 }, { id: 2 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 5 }, { id: 12, orientation: 1 }, { id: 6 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 12, orientation: 2 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 3 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }],
    [{ id: 12, orientation: 2 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 3 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 1 }],
    [{ id: 1 }, { id: 12, orientation: 0 }, { id: 7 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 12, orientation: 0 }, { id: 1 }],
    [{ id: 1 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }],
    [{ id: 6 }, { id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 9, fuse: 20 }, { id: 6 }],
    [{ id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 5 }],
    [{ id: 6 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 4 }, { id: 5 }],
  ],
  [
    [{ id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 6 }, { id: 1 }, { id: 4 }],
    [{ id: 5 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 8 }],
    [{ id: 1 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 1 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 7 }, { id: 4 }, { id: 5 }, { id: 0 }],
    [{ id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 1 }, { id: 4 }, { id: 6 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 4 }],
    [{ id: 4 }, { id: 0 }, { id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 41 }, { id: 1 }],
    [{ id: 4 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 2 }, { id: 6 }],
  ],
  [
    [{ id: 1 }, { id: 6 }, { id: 5 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 5 }, { id: 4 }, { id: 0 }, { id: 3 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 4 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 4 }],
    [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 8 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }],
    [{ id: 1 }, { id: 5 }, { id: 1 }, { id: 2 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 4 }],
    [{ id: 5 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 3 }],
    [{ id: 0 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 0 }, { id: 1 }, { id: 0 }, { id: 1 }],
    [{ id: 4 }, { id: 4 }, { id: 6 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 0 }],
    [{ id: 0 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 5 }, { id: 5 }, { id: 1 }, { id: 0 }],
    [{ id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 3 }, { id: 0 }, { id: 4 }, { id: 0 }],
    [{ id: 1 }, { id: 4 }, { id: 4 }, { id: 1 }, { id: 1 }, { id: 4 }, { id: 5 }, { id: 6 }],
  ],
  [
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 5 }, { id: 6 }, { id: 4 }, { id: 12, orientation: 3 }],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 4 }, { id: 6 }],
    [{ id: 0 }, { id: 6 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 4 }, { id: 0 }, { id: 4 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 2 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 1 }, { id: 12, orientation: 2 }, { id: 1 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 0 }],
    [{ id: 3 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 9, fuse: 35 }, { id: 2 }],
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 5 }, { id: 4 }, { id: 12, orientation: 3 }, { id: 7 }, { id: 6 }],
    [{ id: 8 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 1 }, { id: 1 }, { id: 1 }],
    [{ id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 5 }, { id: 4 }, { id: 0 }],
    [{ id: 1 }, { id: 12, orientation: 2 }, { id: 0 }, { id: 12, orientation: 2 }, { id: 5 }, { id: 5 }, { id: 4 }, { id: 4 }],
    [{ id: 12, orientation: 1 }, { id: 9, fuse: 95 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 0 }],
    [{ id: 0 }, { id: 6 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 12, orientation: 1 }, { id: 4 }, { id: 0 }, { id: 5 }],
    [{ id: 0 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 5 }, { id: 3 }],
  ],
  [
    [{ id: 5 }, { id: 4 }, { id: 5 }, { id: 5 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 12, orientation: 3 },],
    [{ id: 4 }, { id: 1 }, { id: 6 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 4 }, { id: 5 },],
    [{ id: 5 }, { id: 3 }, { id: 5 }, { id: 0 }, { id: 1 }, { id: 6 }, { id: 12, orientation: 1 }, { id: 0 },],
    [{ id: 4 }, { id: 4 }, { id: 0 }, { id: 0 }, { id: 0 }, { id: 4 }, { id: 1 }, { id: 4 },],
    [{ id: 0 }, { id: 1 }, { id: 5 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 1 }, { id: 6 },],
    [{ id: 6 }, { id: 8 }, { id: 5 }, { id: 9, fuse: 25 }, { id: 5 }, { id: 2 }, { id: 9, fuse: 75 }, { id: 5 },],
    [{ id: 2 }, { id: 5 }, { id: 1 }, { id: 12, orientation: 0 }, { id: 1 }, { id: 0 }, { id: 4 }, { id: 0 },],
    [{ id: 0 }, { id: 0 }, { id: 4 }, { id: 7 }, { id: 5 }, { id: 12, orientation: 3 }, { id: 9, fuse: 5 }, { id: 4 },],
    [{ id: 5 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 3 }, { id: 9, fuse: 50 }, { id: 2 }, { id: 4 },],
    [{ id: 1 }, { id: 5 }, { id: 0 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 0 }, { id: 12, orientation: 0 }, { id: 12, orientation: 3 },],
    [{ id: 6 }, { id: 4 }, { id: 1 }, { id: 12, orientation: 2 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 12, orientation: 0 },],
    [{ id: 3 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 4 }, { id: 0 }, { id: 1 }, { id: 6 },],
    [{ id: 4 }, { id: 5 }, { id: 4 }, { id: 4 }, { id: 5 }, { id: 0 }, { id: 5 }, { id: 4 },],
    [{ id: 5 }, { id: 4 }, { id: 9, fuse: 10 }, { id: 4 }, { id: 0 }, { id: 5 }, { id: 0 }, { id: 4 },],
  ],
];

let i = 0;
test.forEach(lvl => {
  // console.log(lvl);
  console.log(`\n\n${i}\n`);
  console.log(compressBoardData(lvl));
  i++;
});

// LEVEL IDEAS:
// Pesky Coin (coins blocking crates)
// Key Chain (tons of keys & doors)
// Potholes (lots of craters)
// Demolition Man (no craters only bombs)
// Payday (tons of coins)