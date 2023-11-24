import AsyncStorage from "@react-native-async-storage/async-storage";
import { Board, BoardTile, BombTile, Level, OneWayTile, TileType } from "./types";

import { defaultSettings } from "../GlobalContext";
const settingsKeys = Object.keys(defaultSettings);

export async function getSavedSettings() {
  const settings = { ...defaultSettings };

  for (let i = 0; i < settingsKeys.length; i++) {
    const key = settingsKeys[i];
    let savedValue;

    try {
      savedValue = await getData(key);
    } catch (err) {
      console.error("Error reading settings from AsyncStorage:", err);
    }

    if (savedValue) {
      // @ts-expect-error Not sure why TypeScript is unable to tell that this is a valid key.
      settings[key] = savedValue;
    }
  }

  return settings;
}

export async function importStoredLevels() {
  const levels: Level[] = [];

  try {
    const keys: readonly string[] = await AsyncStorage.getAllKeys();

    for (let i = 0; i < keys.length; i++) {
      if (settingsKeys.includes(keys[i])) {
        continue; // Ignore settings.
      } else {
        // If it isn't a setting it is a level.
        const level = await getData(keys[i]);
        levels.push(level);
      }
    }
  } catch (err) {
    console.error("Error reading levels from AsyncStorage:", err);
  }

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

export async function getData(key: string) {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != undefined ? JSON.parse(jsonValue) : undefined;
  } catch (err) {
    console.error("Error reading from AsyncStorage:", err);
  }
}

export async function markLevelCompleted(uuid: string) {
  const level = await getData(uuid) as Level;
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

// const test: Board[] = [
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

// test.forEach(lvl => {
//   // console.log(lvl);
//   console.log(compressBoardData(lvl));
// });

// LEVEL IDEAS:
// Pesky Coin (coins blocking crates)
// Key Chain (tons of keys & doors)
// Potholes (lots of craters)
// Demolition Man (no craters only bombs)
// Payday (tons of coins)