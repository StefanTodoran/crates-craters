import { useMemo } from "react";
import { Dimensions } from "react-native";
import { getSpawnPosition } from "../util/logic";
import { Level } from "../util/types";
import { calcPreviewTileSize } from "../util/board";
import GameBoard from "./GameBoard";

const win = Dimensions.get("window");

interface Props {
  level: Level,
  previewSize: number,
  previewWidth: number,
  // rowCorrect?: number,
}

export default function BoardPreview({
  level,
  previewSize,
  previewWidth,
  // rowCorrect,
}: Props) {
  const tileSize = calcPreviewTileSize(level.board.width, previewWidth, win);
  const previewCenter = useMemo(() => getSpawnPosition(level.board).y, [level]);

  let previewTop, previewBottom;
  if (previewCenter - previewSize < 0) {
    previewTop = 0;
    previewBottom = (previewSize * 2);
  } else if (previewCenter + previewSize > level.board.height) {
    previewTop = level.board.height - (previewSize * 2);
    previewBottom = level.board.height;
  } else {
    previewTop = previewCenter - previewSize;
    previewBottom = previewCenter + previewSize;
  }

  return (
    <GameBoard
      board={level.board.slice(previewTop, previewBottom)}
      overrideTileSize={tileSize}
      // rowCorrect={rowCorrect}
    />
  );
}