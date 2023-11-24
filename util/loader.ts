import AsyncStorage from "@react-native-async-storage/async-storage";
import { Board, BoardTile, BombTile, Level, OneWayTile, TileType } from "./types";

import { defaultSettings } from "../GlobalContext";
const settingsKeys = Object.keys(defaultSettings);

export async function getSavedSettings() {
  const settings = {...defaultSettings};

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

export function parseCompressedBoardData(raw: string): Board {
  const rawBoard = raw.split("/");
  const board: Board = [];

  rawBoard.forEach(strRow => {
    const rawRow = strRow.split(",");
    const row: BoardTile[] = [];

    rawRow.forEach(strTile => {
      if (strTile.includes(".")) {
        const tileData = strTile.split(".").map(substr => parseInt(substr));
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