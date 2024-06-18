import { ScaledSize } from "react-native";
import { Direction, FlatTile, OneWayTile, TileType } from "./types";
import { graphics } from "../Theme";

// ======================= \\
// BOARD HANLDER FUNCTIONS \\

export function calcPreviewTileSize(tilesWidth: number, widthPercent: number, window: ScaledSize) {
  const maxWidth = (window.width * widthPercent) / tilesWidth;
  return Math.floor(maxWidth);
}

export function calcBoardTileSize(boardWidth: number, boardHeight: number, window: ScaledSize) {
  const maxWidth = (window.width * 0.9) / boardWidth;
  const maxHeight = (window.height * 0.8) / boardHeight;
  return Math.floor(Math.min(maxWidth, maxHeight));
}

// BOARD HANLDER FUNCTIONS \\
// ======================= \\

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

  const oneway = (tile as OneWayTile);
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.UP) return graphics.ONE_WAY_UP;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.RIGHT) return graphics.ONE_WAY_RIGHT;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.DOWN) return graphics.ONE_WAY_DOWN;
  if (tile.id === TileType.ONEWAY && oneway.orientation === Direction.LEFT) return graphics.ONE_WAY_LEFT;
}