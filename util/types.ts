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
  OUTSIDE, // Used for out of bounds board queries.
}

export enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
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
  orientation: Direction,
}

export interface BombTile {
  id: TileType.BOMB,
  fuse: number,
}

// A SimpleTile is a tile which only has an id and no other properties.
export interface SimpleTile {
  id: Exclude<TileType, TileType.ONEWAY | TileType.BOMB>,
}

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
  best?: number, // Guaranteed to be defined if completed, represents the minimum moves the user has used to beat the level.
}

export interface OfficialLevel extends LevelBase {
  official: true,
  order: number,
}

type DateString = string; // In the form Date().toISOString();
export interface UserLevel extends LevelBase {
  official: false,
  designer: string,
  created: DateString, 
  shared?: DateString,
}

export interface SharedLevel extends Exclude<UserLevel, "created"> {
  shared: DateString,
  downloads: number,
  attempts: number,
  wins: number,
  likes: number,
  winrate: number,
  best: number,
}

export type Level = OfficialLevel | UserLevel | SharedLevel;

enum LevelObjectType {
  BASE,
  OFFICIAL,
  USER,
  SHARED,
}

type levelObjectPropSet = { [key: string]: string };
const levelObjectProps: { [key in LevelObjectType]: levelObjectPropSet } = {
  [LevelObjectType.BASE]: {
    "uuid": "string",
    "name": "string",
    "board": "object",
    // TODO: Figure out why completed doesn't always exist?
    // "completed": "boolean", 
    "official": "boolean",
  },
  [LevelObjectType.OFFICIAL]: {}, // TODO: Add the appropriate keys here.
  [LevelObjectType.USER]: {},
  [LevelObjectType.SHARED]: {},
}

export function isLevelWellFormed(target: any, check: LevelObjectType = LevelObjectType.BASE): target is Level {
  if (target === null || target === undefined) return false;

  const props = levelObjectProps[check];
  for (const [key, type] of Object.entries(props)) {
    if (!(key in target)) return false;
    if (typeof target[key] !== type) return false;
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