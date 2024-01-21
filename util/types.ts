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
  id: Exclude<TileType, TileType.ONEWAY | TileType.BOMB>,
}

export type BoardTile = SimpleTile | OneWayTile | BombTile;
export type Board = BoardTile[][];

interface LevelBase {
  uuid: string,
  name: string,
  board: Board,
  completed: boolean,
  official: boolean,
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

export interface SharedLevel extends UserLevel {
  shared: DateString,
  downloads: number,
}

export type Level = OfficialLevel | UserLevel;

export function createBlankBoard() {
  const blankBoard: Board = [];
  for (let i = 0; i < 14; i++) {
    const row = [];
    for (let j = 0; j < 8; j++) {
      row.push({ id: 0 });
    }
    blankBoard.push(row);
  }
  blankBoard[1][1] = { id: TileType.SPAWN };
  blankBoard[2][6] = { id: TileType.FLAG };
  return blankBoard;
}

// ========================= \\
// OTHER MISCELLANEOUS TYPES \\

export enum PageView {
  MENU,
  LEVELS,
  PLAY,
  EDIT, // Edit page
  EDITOR, // Actual editor
  SETTINGS,
  STORE,
}

export enum EditorView {
  LIST,
  CREATE,
  EDIT,
}