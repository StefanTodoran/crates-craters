import { useMemo } from "react";
import { Dimensions } from "react-native";
import { getSpawnPosition } from "../util/logic";
import { Level } from "../util/types";
import GameBoard from "./GameBoard";
import { calcPreviewTileSize } from "../util/board";

const win = Dimensions.get("window");

interface Props {
  level: Level,
  previewSize: number,
  previewWidth: number,
  rowCorrect?: number,
}

export default function BoardPreview({
  level,
  previewSize,
  previewWidth,
  rowCorrect
}: Props) {
  const tileSize = calcPreviewTileSize(level.board[0].length, previewWidth, win);
  const previewCenter = useMemo(() => getSpawnPosition(level.board).y, [level]);

  let previewTop, previewBottom;
  if (previewCenter - previewSize < 0) {
    previewTop = 0;
    previewBottom = (previewSize * 2);
  } else if (previewCenter + previewSize > level.board.length) {
    previewTop = level.board.length - (previewSize * 2);
    previewBottom = level.board.length;
  } else {
    previewTop = previewCenter - previewSize;
    previewBottom = previewCenter + previewSize;
  }

  return (
    <GameBoard
      board={level.board.slice(previewTop, previewBottom)}
      overrideTileSize={tileSize}
      rowCorrect={rowCorrect}
    />
  );
}