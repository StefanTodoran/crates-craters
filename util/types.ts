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

export interface OneWayTile {
  id: TileType.ONEWAY,
  orientation: Direction,
}

export interface BombTile {
  id: TileType.BOMB,
  fuse: number,
}

export interface SimpleTile {
  id: Exclude<TileType, TileType.ONEWAY | TileType.BOMB>
}

export type BoardTile = SimpleTile | OneWayTile | BombTile;
export type Board = BoardTile[][];

interface LevelBase {
  uuid: string,
  name: string,
  board: Board,
  completed: boolean,
  official: boolean,
  designer?: string,
}

interface OfficialLevel extends LevelBase {
  official: true,
}

interface UserLevel extends LevelBase {
  official: false,
  designer: string,
}

export type Level = OfficialLevel | UserLevel;

// ========================= \\
// OTHER MISCELLANEOUS TYPES \\

export enum PageView {
  MENU,
  LEVELS,
  PLAY,
  EDIT,
  SETTINGS,
  STORE,
}