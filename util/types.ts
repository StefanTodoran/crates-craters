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

export const ForegroundTileTypes = [
  TileType.EMPTY,
  TileType.DOOR,
  TileType.KEY,
  TileType.CRATE,
  TileType.CRATER,
  TileType.COIN,
  TileType.SPAWN,
  TileType.FLAG,
  TileType.BOMB,
  TileType.EXPLOSION,
  TileType.LITTLE_EXPLOSION,
  TileType.OUTSIDE,
]

export const BackgroundTileTypes = [
  TileType.EMPTY,
  TileType.WALL,
  TileType.ONEWAY,
  TileType.OUTSIDE,
]

export enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT,
}

export interface EmptyTile {
  id: TileType.EMPTY,
}
export const emptyTile: EmptyTile = { id: TileType.EMPTY };

export interface OutsideTile {
  id: TileType.OUTSIDE,
}
export const outsideTile: OutsideTile = { id: TileType.OUTSIDE };

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

export class Board<T> {
  public width: number;
  public height: number;
  protected board: T[][];

  constructor(board: T[][]) {
    this.board = board;
    this.height = board.length;
    this.width = board[0].length;
  }

  inBounds(yPos: number, xPos: number) {
    return (yPos >= 0 && yPos < this.height && xPos >= 0 && xPos < this.width);
  }

  map(callbackfn: (value: T[], index: number, array: T[][]) => any) {
    return this.board.map(callbackfn);
  }
}

export class FlatBoard extends Board<FlatTile> {
  constructor(board: FlatTile[][]) {
    super(board);
  }

  static createEmptyBoard(width: number = 8, height: number = 14) {
    return Array.from({ length: height },
      () => Array.from({ length: width }, () => emptyTile)
    );
  }

  clone() {
    const newBoard = new FlatBoard(FlatBoard.createEmptyBoard(this.width, this.height));

    for (let yPos = 0; yPos < this.height; yPos++) {
      for (let xPos = 0; xPos < this.width; xPos++) {
        const originalTile = this.board[yPos][xPos];
        const copiedTile = { ...originalTile };
        newBoard.board[yPos][xPos] = copiedTile;
      }
    }

    return newBoard;
  }

  slice(start: number, end: number) {
    const slicedBoard = this.board.slice(start, end);
    return new FlatBoard(slicedBoard);
  }

  getTile(yPos: number, xPos: number, checkBounds?: boolean): FlatTile {
    if (!checkBounds || this.inBounds(yPos, xPos)) return this.board[yPos][xPos];
    return outsideTile;
  }

  setTile(yPos: number, xPos: number, tile: FlatTile) {
    this.board[yPos][xPos] = tile;
  }

  findAdjacentWalls(yPos: number, xPos: number) {
    return {
      top: yPos > 0 && this.board[yPos - 1][xPos].id === TileType.WALL,
      left: xPos > 0 && this.board[yPos][xPos - 1].id === TileType.WALL,
      bottom: yPos + 1 < this.height && this.board[yPos + 1][xPos].id === TileType.WALL,
      right: xPos + 1 < this.width && this.board[yPos][xPos + 1].id === TileType.WALL,
    };
  }
}

export class LayeredBoard extends Board<LayeredTile> {
  constructor(board: LayeredTile[][]) {
    super(board);
  }

  static createEmptyBoard(width: number = 8, height: number = 14) {
    return Array.from({ length: height },
      () => Array.from({ length: width }, () => {
        return {
          foreground: emptyTile,
          background: emptyTile,
        };
      })
    );
  }

  clone() {
    const newBoard = new LayeredBoard(LayeredBoard.createEmptyBoard(this.width, this.height));

    for (let yPos = 0; yPos < this.height; yPos++) {
      for (let xPos = 0; xPos < this.width; xPos++) {
        const originalTile = this.board[yPos][xPos];
        const copiedTile = {
          foreground: { ...originalTile.foreground },
          background: { ...originalTile.background },
        };
        newBoard.board[yPos][xPos] = copiedTile;
      }
    }

    return newBoard;
  }

  slice(start: number, end: number) {
    const slicedBoard = this.board.slice(start, end);
    return new LayeredBoard(slicedBoard);
  }

  getLayer(yPos: number, xPos: number, checkBounds?: boolean): LayeredTile {
    if (!checkBounds || this.inBounds(yPos, xPos)) return this.board[yPos][xPos];
    return {
      foreground: outsideTile,
      background: outsideTile,
    };
  }

  /**
   * Queries the target position and returns the foreground tile. If bounds checking is 
   * requested, returns the special outside tile type for out of bounds queries. 
   */
  getTile(yPos: number, xPos: number, checkBounds?: boolean): ForegroundTile {
    return this.getLayer(yPos, xPos, checkBounds).foreground;
  }

  setTile(yPos: number, xPos: number, tile: ForegroundTile) {
    this.board[yPos][xPos].foreground = tile;
  }

  getBackground(yPos: number, xPos: number, checkBounds?: boolean): BackgroundTile {
    return this.getLayer(yPos, xPos, checkBounds).background;
  }

  setBackground(yPos: number, xPos: number, tile: BackgroundTile) {
    this.board[yPos][xPos].background = tile;
  }

  findAdjacentWalls(yPos: number, xPos: number) {
    return {
      top: yPos > 0 && this.board[yPos - 1][xPos].background.id === TileType.WALL,
      left: xPos > 0 && this.board[yPos][xPos - 1].background.id === TileType.WALL,
      bottom: yPos + 1 < this.height && this.board[yPos + 1][xPos].background.id === TileType.WALL,
      right: xPos + 1 < this.width && this.board[yPos][xPos + 1].background.id === TileType.WALL,
    };
  }
}

export function unsqueezeBoard(flatBoard: FlatBoard) {
  const layeredBoard: LayeredTile[][] = [];

  for (let yPos = 0; yPos < flatBoard.height; yPos++) {
    const row: LayeredTile[] = [];

    for (let xPos = 0; xPos < flatBoard.width; xPos++) {
      const tile = flatBoard.getTile(yPos, xPos);
      const layer: LayeredTile = {
        foreground: emptyTile,
        background: emptyTile,
      };

      if (BackgroundTileTypes.includes(tile.id)) {
        layer.background = tile as BackgroundTile;
      } else { // if (ForegroundTileTypes.includes(tile.id))
        layer.foreground = tile as ForegroundTile;
      }
      row.push(layer);
    }

    layeredBoard.push(row);
  }

  return layeredBoard;
}

export function createBlankBoard() {
  const blankBoard = new FlatBoard(FlatBoard.createEmptyBoard());
  for (let i = 0; i < blankBoard.height; i++) {
    for (let j = 0; j < blankBoard.width; j++) {
      blankBoard.setTile(i, j, { id: 0 });
    }
  }

  blankBoard.setTile(1, 1, { id: TileType.SPAWN });
  blankBoard.setTile(2, 6, { id: TileType.FLAG });
  return blankBoard;
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

export interface SharedLevel extends UserLevel {
  // TODO: SharedLevel objects fetched from the server WON'T have the "created" property!.
  shared: DateString,
  downloads: number,
  attempts: number,
  wins: number,
  likes: number,
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