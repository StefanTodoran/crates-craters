import { ScaledSize } from "react-native";
import { graphics } from "../Theme";
import { BackgroundTile, Direction, EmptyTile, FlatTile, ForegroundTile, LayeredTile, OneWayTile, OutsideTile, TileType } from "./types";

export const emptyTile: EmptyTile = { id: TileType.EMPTY };
export const outsideTile: OutsideTile = { id: TileType.OUTSIDE };

// const ForegroundTileTypes = [
//   TileType.EMPTY,
//   TileType.DOOR,
//   TileType.KEY,
//   TileType.CRATE,
//   TileType.CRATER,
//   TileType.COIN,
//   TileType.SPAWN,
//   TileType.FLAG,
//   TileType.BOMB,
//   TileType.EXPLOSION,
//   TileType.LITTLE_EXPLOSION,
//   TileType.METAL_CRATE,
//   TileType.ICE_BLOCK,
//   TileType.OUTSIDE,
// ];

const BackgroundTileTypes = [
  TileType.EMPTY,
  TileType.WALL,
  TileType.ONEWAY,
  TileType.OUTSIDE,
];

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

export function calcPreviewTileSize(tilesWidth: number, widthPercent: number, window: ScaledSize) {
  const maxWidth = (window.width * widthPercent) / tilesWidth;
  return Math.floor(maxWidth);
}

export function calcBoardTileSize(boardWidth: number, boardHeight: number, window: ScaledSize) {
  const maxWidth = (window.width * 0.9) / boardWidth;
  const maxHeight = (window.height * 0.8) / boardHeight;
  return Math.floor(Math.min(maxWidth, maxHeight));
}

// This can't just be a dictionary since `graphics` may change.
export function getIconSrc(tile: FlatTile) {
  if (tile.id === TileType.DOOR) return graphics.DOOR;
  if (tile.id === TileType.KEY) return graphics.KEY;
  if (tile.id === TileType.CRATE) return graphics.CRATE;
  if (tile.id === TileType.CRATER) return graphics.CRATER;
  if (tile.id === TileType.COIN) return graphics.COIN;
  if (tile.id === TileType.SPAWN) return graphics.PLAYER; // Exists for level creation only.
  if (tile.id === TileType.FLAG) return graphics.FLAG;
  if (tile.id === TileType.BOMB) return graphics.BOMB;
  if (tile.id === TileType.EXPLOSION) return graphics.EXPLOSION;
  if (tile.id === TileType.LITTLE_EXPLOSION) return graphics.LITTLE_EXPLOSION;
  if (tile.id === TileType.METAL_CRATE) return graphics.METAL_CRATE;
  if (tile.id === TileType.ICE_BLOCK) return graphics.ICE_BLOCK;

  const oneway = (tile as OneWayTile);
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.UP) return graphics.ONE_WAY_UP;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.RIGHT) return graphics.ONE_WAY_RIGHT;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.DOWN) return graphics.ONE_WAY_DOWN;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.LEFT) return graphics.ONE_WAY_LEFT;
}