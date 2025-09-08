import { UserCredential } from "firebase/auth";
import { FlatBoard } from "./board";

export interface UserData extends UserCredential {
  data: {
    id: string,
    username: string,
    likes: [],
    attempted: [],
    completed: [],
    coins: [],
  }
}

// ============= \\
// TILES & BOARD \\

export enum TileType {
  EMPTY,
  WALL,
  DOOR,
  KEY,
  CRATE,
  CRATER,
  COIN,
  SPAWN,
  FLAG,
  BOMB,
  EXPLOSION,
  LITTLE_EXPLOSION,
  ONEWAY,
  METAL_CRATE,
  ICE_BLOCK,
  OUTSIDE, // Used for out of bounds board queries. Other enum values shouldn't be reordered but this one can be.
}

export enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export interface Offset {
  dx: number,
  dy: number,
}

export function rotationToDirection(rotation: number): Direction {
  const maximum = 360;
  rotation = ((rotation % maximum) + maximum) % maximum;

  switch (rotation) {
    case 0:
      return Direction.LEFT;
    case 90:
      return Direction.UP;
    case 180:
      return Direction.RIGHT;
    case 270:
      return Direction.DOWN;
    default:
      throw new Error(`Invalid rotation: ${rotation}`);
  }
}

export function directionToOffset(direction: Direction): Offset {
  let dx = 0;
  let dy = 0;
  if (direction === Direction.UP) {
    dy = -1;
  } else if (direction === Direction.DOWN) {
    dy = 1;
  } else if (direction === Direction.LEFT) {
    dx = -1;
  } else if (direction === Direction.RIGHT) {
    dx = 1;
  }
  return { dx, dy };
}

export function offsetToDirection(offset: Offset): Direction {
  if (offset.dy === -1) return Direction.UP;
  if (offset.dy === 1) return Direction.DOWN;
  if (offset.dx === -1) return Direction.LEFT;
  if (offset.dx === 1) return Direction.RIGHT;
  throw new Error(`Invalid offset: ${offset}`);
}

export interface EmptyTile {
  id: TileType.EMPTY,
}

export interface OutsideTile {
  id: TileType.OUTSIDE,
}

export interface WallTile {
  id: TileType.WALL,
}

export interface OneWayTile {
  id: TileType.ONEWAY,
  blocked: Direction[],
}

export interface BombTile {
  id: TileType.BOMB,
  fuse: number,
}

// A SimpleTile is a tile which only has an id and no other properties.
export interface SimpleTile {
  id: Exclude<TileType, TileType.ONEWAY | TileType.BOMB>,
}

export const pushableTiles = [TileType.CRATE, TileType.METAL_CRATE, TileType.BOMB];
export const fillCapableTiles = [TileType.CRATE, TileType.ICE_BLOCK];
export const explodableTiles = [TileType.CRATE, TileType.ICE_BLOCK];

export type ForegroundTile = SimpleTile | BombTile;
export type BackgroundTile = EmptyTile | OutsideTile | OneWayTile | WallTile;

export type FlatTile = ForegroundTile | BackgroundTile;
export interface LayeredTile {
  foreground: ForegroundTile,
  background: BackgroundTile,
}

// ============= \\
// LEVEL OBJECTS \\

interface LevelBase {
  uuid: string,
  name: string,
  board: FlatBoard,
  official: boolean,
  completed: boolean,
  bestSolution?: string, // If completed, the shortest solution found by the user.
}

export enum Tutorial {
  MOVEMENT = 0,
  OBJECTIVE = 1,
  CRATES_CRATERS = 2,
  ONEWAY_TILES = 3,
  // FILTERS = 4,
  DOORS_KEYS = 5,
  BOMBS = 6,
  METAL_CRATES = 7,
  ICE_BLOCKS = 8,
  MISC = 9,
}

export interface OfficialLevel extends LevelBase {
  official: true,
  order: number,
  introduces?: Tutorial[],
}

type DateString = string; // In the form Date().toISOString();
export interface UserLevel extends LevelBase {
  official: false,
  created: DateString,
  user_name: string,
  shared?: DateString,
  db_id?: string, // The document id in the database, if shared.
}

export interface SharedLevel extends Exclude<UserLevel, "created"> {
  user_email: string,
  shared: DateString,
  downloads: number,
  attempts: number,
  wins: number,
  likes: number,
  winrate: number,
  best: number,
}

export type Level = OfficialLevel | UserLevel | SharedLevel;

export enum LevelObjectType {
  BASE,
  OFFICIAL,
  USER,
  SHARED,
}

type levelObjectPropSet = {
  required: { [key: string]: string },
  optional: { [key: string]: string },
};

const levelObjectProps: { [key in LevelObjectType]: levelObjectPropSet } = {
  [LevelObjectType.BASE]: {
    required: {
      "uuid": "string",
      "name": "string",
      "board": "object",
      "official": "boolean",
    },
    optional: {
      "completed": "boolean", // TODO: Figure out why completed doesn't always exist?
      "bestSolution": "string",
    },
  },
  [LevelObjectType.OFFICIAL]: {
    required: {
      "order": "number",
    },
    optional: {
      "introduces": "array",
    },
  },
  [LevelObjectType.USER]: {
    required: {
      "created": "string",
      "user_name": "string",
    },
    optional: {
      "shared": "string",
      "db_id": "string",
    },
  },
  [LevelObjectType.SHARED]: {
    required: {
      "user_email": "string",
      "user_name": "string",
      "shared": "string",
      "downloads": "number",
      "attempts": "number",
      "wins": "number",
      "likes": "number",
      "winrate": "number",
      "best": "number",
    },
    optional: {},
  },
}

export function isLevelWellFormed(target: any, check: LevelObjectType = LevelObjectType.BASE): target is Level {
  if (target === null || target === undefined) return false;
  const props = levelObjectProps[check];
  const incorrectKeys: string[] = [];

  for (const [key, type] of Object.entries(props.required)) {
    if (!(key in target)) {
      incorrectKeys.push(key);
      continue;
    }

    if (type === "array") {
      if (!Array.isArray(target[key])) incorrectKeys.push(key);
    }
    else if (typeof target[key] !== type) incorrectKeys.push(key);
  }

  for (const [key, type] of Object.entries(props.optional)) {
    if (!(key in target)) continue;

    if (type === "array") {
      if (!Array.isArray(target[key])) incorrectKeys.push(key);
    }
    else if (typeof target[key] !== type) incorrectKeys.push(key);
  }

  if (incorrectKeys.length > 0) {
    console.warn(`Level ${target.uuid} is malformed. Offending keys: ${incorrectKeys.join(", ")}`);
    return false;
  }
  return true;
}

// ========================= \\
// OTHER MISCELLANEOUS TYPES \\

export enum PageView {
  LEVELS,
  MANAGE,
  STORE,
  SETTINGS,
  // First four must remain in order.
  MENU,
  PLAY,
  EDITOR,
}

export enum PlayMode {
  STANDARD,
  SHARED,
  PLAYTEST,
}

export interface LocalUserData {
  uuid: string,
  joined: DateString,
}