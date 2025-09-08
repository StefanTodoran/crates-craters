import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleProp, StyleSheet, View } from "react-native";
import { colors, graphics } from "../Theme";
import { getIconSrc } from "../util/board";
import { Game, isValidMove, pushIceBlock } from "../util/logic";
import { Offset, TileType, offsetToDirection } from "../util/types";
import BombBoardTile from "./BombBoardTile";

const MAX_PLAYER_ROTATION_DEG = 5;
const ICE_BLOCK_LINE_SIZE = 5;

interface Props {
  game: Game,
  touch: { x: number, y: number },
  darkMode: boolean,
  tileSize: number,
}

export default function Player({
  game,
  touch,
  darkMode,
  tileSize,
}: Props) {
  const optionsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(optionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(optionsAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [game.won]);

  const playerSrc = (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;
  const tileStyle = {
    width: tileSize,
    height: tileSize,
  };

  const [options, pushables, iceBlockPreviews] = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: JSX.Element[] = [];
    const newPushables: JSX.Element[] = [];
    const newIceBlockPreviews: (IceBlockPreview | null)[] = [];

    const offsets: Offset[] = [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];

    offsets.forEach((offset, index) => {
      const shouldHighlight = isValidMove(game, offset);

      // It would make sense to not add the Animated.View if it isn't over a shouldHighlight tile.
      // However this results in the animation breaking sometimes, even if we add dummy Animated.View
      // with the same id. Oddly the dummy Animated.View with same id prevents some situations
      // which break the Animated.loop, but not all.
      const optionStyle = styles.optionTile(game.player.x + offset.dx, game.player.y + offset.dy, tileSize, optionsAnim, shouldHighlight, darkMode);
      newOptions.push(<Animated.View key={index} style={optionStyle}></Animated.View>);

      const pushable = getAdjacentTile(game, offset, tileSize, tileStyle, shouldHighlight);
      newPushables.push(pushable);

      const iceBlockPreview = getIceBlockPreview(game, offset, shouldHighlight);
      newIceBlockPreviews.push(iceBlockPreview);
    });

    return [newOptions, newPushables, newIceBlockPreviews];
  }, [game, tileSize, darkMode]);

  return (
    <>
      {!game.won && options}

      {/* Ice block slide path previews */}
      {iceBlockPreviews[0] && <>
        <View style={styles.iceBlockPreview(iceBlockPreviews[0].topX, iceBlockPreviews[0].topY, iceBlockPreviews[0].width, iceBlockPreviews[0].height, tileSize, -touch.y, "top", darkMode)} />
        <View style={styles.iceBlockHead(iceBlockPreviews[0].topX, iceBlockPreviews[0].topY, tileSize, -touch.y, "top", darkMode)} />
      </>}
      {iceBlockPreviews[1] && <>
        <View style={styles.iceBlockPreview(iceBlockPreviews[1].topX, iceBlockPreviews[1].topY, iceBlockPreviews[1].width, iceBlockPreviews[1].height, tileSize, -touch.x, "left", darkMode)} />
        <View style={styles.iceBlockHead(iceBlockPreviews[1].topX, iceBlockPreviews[1].topY, tileSize, -touch.x, "left", darkMode)} />
      </>}
      {iceBlockPreviews[2] && <>
        <View style={styles.iceBlockPreview(iceBlockPreviews[2].topX, iceBlockPreviews[2].topY, iceBlockPreviews[2].width, iceBlockPreviews[2].height, tileSize, touch.x, "right", darkMode)} />
        <View style={styles.iceBlockHead(iceBlockPreviews[2].bottomX, iceBlockPreviews[2].bottomY, tileSize, touch.x, "right", darkMode)} />
      </>}
      {iceBlockPreviews[3] && <>
        <View style={styles.iceBlockPreview(iceBlockPreviews[3].topX, iceBlockPreviews[3].topY, iceBlockPreviews[3].width, iceBlockPreviews[3].height, tileSize, touch.y, "bottom", darkMode)} />
        <View style={styles.iceBlockHead(iceBlockPreviews[3].bottomX, iceBlockPreviews[3].bottomY, tileSize, touch.y, "bottom", darkMode)} />
      </>}

      {/* Pushables tiles previews */}
      <View style={styles.adjacentTileContainer(game.player.x, game.player.y - 1, tileSize, touch.y, false, false)}>
        {pushables[0]}
      </View>
      <View style={styles.adjacentTileContainer(game.player.x - 1, game.player.y, tileSize, touch.x, true, false)}>
        {pushables[1]}
      </View>
      <View style={styles.adjacentTileContainer(game.player.x + 1, game.player.y, tileSize, touch.x, true, true)}>
        {pushables[2]}
      </View>
      <View style={styles.adjacentTileContainer(game.player.x, game.player.y + 1, tileSize, touch.y, false, true)}>
        {pushables[3]}
      </View>

      <View style={styles.playerContainer(game.player.x, game.player.y, tileSize, touch.x, touch.y)}>
        <Image style={tileStyle} source={playerSrc} />
      </View>
    </>
  );
}

function getAdjacentTile(game: Game, offset: Offset, tileSize: number, tileStyle: StyleProp<any>, isValidMove: boolean) {
  if (!isValidMove) {
    return <View style={tileStyle} />;
  }

  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;
  const tile = game.board.getTile(yPos, xPos, true);

  if ([TileType.CRATE, TileType.METAL_CRATE, TileType.ICE_BLOCK].includes(tile.id)) {
    return <Image style={tileStyle} source={getIconSrc(tile)!.icon} />;
  }
  if (tile.id === TileType.BOMB) {
    return <BombBoardTile tile={tile} icon={getIconSrc(tile)!.icon} tileSize={tileSize} />;
  }

  return <View style={tileStyle} />;
}

interface IceBlockPreview {
  topX: number;
  topY: number;
  bottomX: number;
  bottomY: number;
  height: number;
  width: number;
}

function getIceBlockPreview(game: Game, offset: Offset, isValidMove: boolean): IceBlockPreview | null {
  if (!isValidMove) return null;

  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;
  const tile = game.board.getTile(yPos, xPos, true);

  if (tile.id === TileType.ICE_BLOCK) {
    const endPosition = pushIceBlock(game.board, game.player, offsetToDirection(offset));
    const xTiles = Math.abs(endPosition.x - xPos);
    const yTiles = Math.abs(endPosition.y - yPos);
    if (xTiles <= 1 && yTiles <= 1) {
      // We don't need a preview if the block won't slide.
      return null;
    }

    return {
      topX: Math.min(xPos, endPosition.x),
      topY: Math.min(yPos, endPosition.y),
      bottomX: Math.max(xPos, endPosition.x),
      bottomY: Math.max(yPos, endPosition.y),
      height: yTiles,
      width: xTiles,
    };
  }

  return null;
}

function unsignedMax(num: number, max: number) {
  return Math.abs(num) > max ? Math.sign(num) * max : num;
}

const styles = StyleSheet.create<any>({
  // tile: (size: number) => ({
  //   width: size,
  //   height: size,
  // }),
  playerContainer: (xPos: number, yPos: number, tileSize: number, touchX: number, touchY: number) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      {
        translateY: unsignedMax(touchY, tileSize),
      },
      {
        translateX: unsignedMax(touchX, tileSize),
      },
      {
        rotate: `${(unsignedMax(touchX, tileSize) / tileSize) * MAX_PLAYER_ROTATION_DEG}deg`,
      },
    ],
  }),
  adjacentTileContainer: (xPos: number, yPos: number, tileSize: number, touchMove: number, isHorizontal: boolean, clampPositive: boolean) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      isHorizontal ? {
        translateX: clampPositive ?
          Math.max(0, unsignedMax(touchMove, tileSize)) :
          Math.min(0, unsignedMax(touchMove, tileSize)),
      } : {
        translateY: clampPositive ?
          Math.max(0, unsignedMax(touchMove, tileSize)) :
          Math.min(0, unsignedMax(touchMove, tileSize)),
      },
    ],
  }),
  optionTile: (xPos: number, yPos: number, size: number, anim: Animated.Value, valid: boolean, darkMode: boolean) => ({
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    opacity: valid ? anim.interpolate({ // was originally static 0.4
      inputRange: [0, 1],
      outputRange: [0.75, 0.3],
      // outputRange: [0.5, 0.2],
    }) : 0,

    borderColor: (darkMode) ? colors.OFF_WHITE : colors.DIM_GRAY,
    borderStyle: "solid",
    borderWidth: 1,

    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 0.95],
        }),
      },
    ],
  }),
  iceBlockPreview: (
    xPos: number, yPos: number,
    width: number, height: number,
    tileSize: number,
    touchMove: number,
    side: "top" | "left" | "right" | "bottom",
    darkMode: boolean,
  ) => {
    let topPos = (yPos * tileSize) + (tileSize / 2);
    let leftPos = (xPos * tileSize) + (tileSize / 2);

    let lineWidth = Math.max(ICE_BLOCK_LINE_SIZE, width * tileSize);
    let lineHeight = Math.max(ICE_BLOCK_LINE_SIZE, height * tileSize);

    if (side === "top") {
      // Adjust for line size
      leftPos -= ICE_BLOCK_LINE_SIZE / 2;

      // Adjust for head size
      topPos += tileSize / 4;
      lineHeight -= tileSize / 4;

      // Adjust for touchMove
      lineHeight -= unsignedMax(touchMove, tileSize);
    } else if (side === "left") {
      topPos -= ICE_BLOCK_LINE_SIZE / 2;
      leftPos += tileSize / 4;
      lineWidth -= tileSize / 4;
      lineWidth -= unsignedMax(touchMove, tileSize);
    } else if (side === "bottom") {
      leftPos -= ICE_BLOCK_LINE_SIZE / 2;
      lineHeight -= tileSize / 4;
      // Adjust for touchMove
      topPos += unsignedMax(touchMove, tileSize);
      lineHeight -= unsignedMax(touchMove, tileSize);
    } else if (side === "right") {
      lineWidth -= tileSize / 4;
      topPos -= ICE_BLOCK_LINE_SIZE / 2;
      // Adjust for touchMove
      leftPos += unsignedMax(touchMove, tileSize);
      lineWidth -= unsignedMax(touchMove, tileSize);
    }

    return {
      position: "absolute",
      top: topPos,
      left: leftPos,
      backgroundColor: (darkMode) ? colors.OFF_WHITE : colors.BLUE_THEME.DARK_COLOR,
      opacity: Math.max(0, unsignedMax(touchMove, tileSize)) / tileSize,
      width: lineWidth,
      height: lineHeight,
    };
  },
  iceBlockHead: (
    xPos: number, yPos: number,
    tileSize: number,
    touchMove: number,
    side: "top" | "left" | "right" | "bottom",
    darkMode: boolean,
  ) => {
    const color = (darkMode) ? colors.OFF_WHITE : colors.BLUE_THEME.DARK_COLOR;
    return {
      position: "absolute",
      left: (xPos * tileSize) + (tileSize / 4),
      top: (yPos * tileSize) + (tileSize / 4),
      width: 0,
      height: 0,
      borderWidth: tileSize / 4,
      borderStyle: "solid",
      borderTopColor: side === "bottom" ? color : "transparent",
      borderLeftColor: side === "right" ? color : "transparent",
      borderRightColor: side === "left" ? color : "transparent",
      borderBottomColor: side === "top" ? color : "transparent",
      opacity: Math.max(0, unsignedMax(touchMove, tileSize)) / tileSize,
    };
  },
});