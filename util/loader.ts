import { MMKV } from "react-native-mmkv";
import { FlatBoard } from "./board";
import { setAppState, updateNotificationCount } from "./store";
import { countInstancesInBoard } from "./logic";
import { BombTile, Direction, FlatTile, Level, LevelObjectType, LocalUserData, OfficialLevel, OneWayTile, TileType, UserLevel, isLevelWellFormed } from "./types";

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

export function getLevelData(key: string): Level | undefined {
  const level = getData(key);
  if (!level?.board) {
    console.warn("No stored level for key:", key);
    return undefined;
  }
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
      // Storage holds the board as plain data; turn it back into a class instance.
      const stored = level.board as unknown as { board: FlatTile[][] };
      level.board = new FlatBoard(stored.board);

      levels.push(level);
    } else {
      // TODO: If the level is malformed, then the key needs to be deleted.
      console.warn("Malformed level detected for key: ", key);
      // deleteLevel(level, olKeys.includes(key) ? metadataKeys.officialLevelKeys : metadataKeys.customLevelKeys);
      // levels.splice(levels.findIndex(level => level.uuid === key), 1);
    }
  });

  // Official levels by their order, then custom levels in the order they were created.
  // (Comparing only when both had an order wasn't transitive, so the result depended on
  // the sort algorithm.)
  const orderOf = (level: Level) => Object.hasOwn(level, "order") ? (level as OfficialLevel).order : Infinity;
  levels.sort((a, b) => {
    const orderA = orderOf(a), orderB = orderOf(b);
    return orderA === orderB ? 0 : orderA < orderB ? -1 : 1;
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
  syncLevelsWithStorage(level.uuid);
}

export function updateLevel(updatedLevel: Pick<UserLevel, "uuid"> & Partial<UserLevel>, boardChange: boolean = true) {
  const existingLevel: UserLevel | undefined = getData(updatedLevel.uuid);

  if (!existingLevel) {
    console.error("Attempted to update non-existent level: " + updatedLevel.uuid);
    return;
  }

  const level: UserLevel = {
    ...existingLevel,
    ...updatedLevel,
  };

  if (boardChange) {
    level.completed = false;
    level.bestSolution = undefined;
  }

  setData(level.uuid, level);
  syncLevelsWithStorage(level.uuid);
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

  syncLevelsWithStorage();
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
  if (!level) return;
  const wasCompleted = level.completed;

  const prevBest = level.bestSolution ? level.bestSolution.length : Infinity;
  if (moveHistory.length < prevBest) level.bestSolution = moveHistory.join("");
  level.completed = true;

  setData(uuid, level);
  syncLevelsWithStorage(uuid);

  if (level.official && !wasCompleted) {
    // We only want to give coins for the first time an official level is completed.
    const gain = countInstancesInBoard(level.board, TileType.COIN);
    modifyCoinBalance(gain);
    updateNotificationCount(2, 1);
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

/**
 * Throws on malformed data. Shared levels come from other players, so a bad board
 * must fail here rather than crash rendering later.
 */
export function parseCompressedBoardData(raw: string): FlatBoard {
  if (typeof raw !== "string") throw new Error("Board data is not a string.");
  const rawBoard = raw.split(split.row);
  const board = new FlatBoard(FlatBoard.createEmptyBoard());
  if (rawBoard.length > board.height) throw new Error(`Board has ${rawBoard.length} rows (max ${board.height}).`);

  const isInt = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
  const checkTileId = (id: number) => {
    if (!isInt(id, 0, TileType.OUTSIDE - 1)) throw new Error(`Invalid tile id "${id}".`);
  };

  rawBoard.forEach((strRow, yPos) => {
    const rawRow = strRow.split(split.column);
    if (rawRow.length > board.width) throw new Error(`Row ${yPos} has ${rawRow.length} tiles (max ${board.width}).`);

    rawRow.forEach((strTile, xPos) => {
      if (strTile.includes(split.tile)) {
        const tileData = strTile.split(split.tile).map(substr => Number(substr));
        checkTileId(tileData[0]);
        if (tileData[0] === TileType.ONEWAY && !tileData.slice(1).every(dir => isInt(dir, Direction.UP, Direction.LEFT))) {
          throw new Error(`Invalid one-way directions at ${yPos},${xPos}.`);
        }
        if (tileData[0] === TileType.BOMB && !isInt(tileData[1], 0, 999)) throw new Error(`Invalid bomb fuse at ${yPos},${xPos}.`);
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
        const id = Number(strTile);
        checkTileId(id);
        board.setTile(yPos, xPos, { id });
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
      let encoding = "";
      // Property order is insertion order (guaranteed for string keys since ES2015),
      // and tiles are always built id first.
      Object.values(tile).forEach((value: number | Direction[]) => {
        const serializedValue = Array.isArray(value) ? value.join(".") : value.toString();
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

/**
 * Reloads levels from storage after it changes: one level by uuid, or all of them.
 * Keeps the editor's level in step, and clears it if it was deleted.
 */
export function syncLevelsWithStorage(uuid?: string) {
  if (!uuid) {
    const levels = getStoredLevels();
    setAppState(({ editorLevel }) => ({
      levels,
      editorLevel: editorLevel && levels.some(level => level.uuid === editorLevel.uuid) ? editorLevel : undefined,
    }));
    return;
  }

  const updated = getLevelData(uuid);
  if (!updated) return;
  setAppState(({ levels, editorLevel }) => ({
    // A level just created (e.g. a copied shared level) isn't in the list yet: add it.
    levels: levels.some(level => level.uuid === uuid) ?
      levels.map(level => level.uuid === uuid ? updated : level) :
      [...levels, updated],
    editorLevel: editorLevel?.uuid === uuid ? updated as UserLevel : editorLevel,
  }));
}

