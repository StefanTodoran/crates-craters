import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Image, ImageStyle, StyleSheet, View, ViewStyle } from "react-native";
import { colors, graphics } from "../Theme";
import { getIconSrc } from "../util/board";
import { Game, findMovingMetalCrates, isValidMove, pushIceBlock } from "../util/logic";
import { Offset, TileType, offsetToDirection } from "../util/types";
import { TouchAnim } from "../util/useGameInput";
import BombBoardTile from "./BombBoardTile";

const ICE_BLOCK_LINE_SIZE = 5;

interface Props {
  game: Game,
  touch: TouchAnim,
  darkMode: boolean,
  tileSize: number,
}

type Side = "top" | "left" | "right" | "bottom";

/**
 * Draws the player and the drag preview: the player and any pushable tile in the drag
 * direction follow the finger, and sliding ice blocks show their path. The drag offset
 * comes in as Animated values, so this only re-renders when the game changes.
 */
export default memo(function Player({
  game,
  touch,
  darkMode,
  tileSize,
}: Props) {
  const optionsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
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
    );
    loop.start();
    // Without this, each game.won change stacked another loop on the same value,
    // and loops kept running natively after unmount.
    return () => loop.stop();
  }, [game.won]);

  const playerSrc = (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;
  const tileStyle = { width: tileSize, height: tileSize };
  const drag = useMemo(() => dragNodes(touch, tileSize), [touch, tileSize]);
  // Dragging moves these views directly, outside React, so after a move React would
  // render the same zero offset as last time, see no change, and leave the stale drag
  // offset on the view (drawing the player a tile past its new position). An invisible
  // per-move change to the transform makes React send the whole fresh transform in the
  // same commit as the new position. (Remounting instead blanks the images for a frame.)
  const nudge = { translateX: (touch.epoch % 2) * 0.001 };
  const optionInnerStyle = useMemo(() => optionTileInner(optionsAnim, darkMode), [darkMode]);

  const [options, pushables, iceBlockPreviews] = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: React.ReactElement[] = [];
    const newPushables: React.ReactElement[] = [];
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
      // Visibility lives on a static wrapper so the native-driven opacity below is never
      // swapped out for a plain number. Swapping it left stale indicators visible (e.g.
      // after a double-tap jump), since detaching a native-driven node doesn't reliably
      // write the static value back to the view.
      newOptions.push(
        <View key={index} style={optionTile(game.player.x + offset.dx, game.player.y + offset.dy, tileSize, shouldHighlight)}>
          <Animated.View style={optionInnerStyle} />
        </View>
      );

      const pushable = getAdjacentTile(game, offset, tileSize, tileStyle, shouldHighlight);
      newPushables.push(pushable);

      const iceBlockPreview = getIceBlockPreview(game, offset, shouldHighlight);
      newIceBlockPreviews.push(iceBlockPreview);
    });

    return [newOptions, newPushables, newIceBlockPreviews];
  }, [game, tileSize, darkMode, optionInnerStyle]);

  return (
    <>
      {!game.won && options}

      {/* The ice previews have no images, so they simply remount each move (keyed on the
          drag epoch, see TouchAnim) and take their animated styles fresh from React. */}
      <React.Fragment key={touch.epoch}>
        {renderIceBlockPreview(iceBlockPreviews[0], tileSize, darkMode, drag, "top")}
        {renderIceBlockPreview(iceBlockPreviews[1], tileSize, darkMode, drag, "left")}
        {renderIceBlockPreview(iceBlockPreviews[2], tileSize, darkMode, drag, "right")}
        {renderIceBlockPreview(iceBlockPreviews[3], tileSize, darkMode, drag, "bottom")}
      </React.Fragment>

      {/* Pushables tiles previews: each only moves away from the player. */}
      <Animated.View style={[styles.absolute, at(game.player.x, game.player.y - 1, tileSize), { transform: [{ translateY: drag.top.toward }, nudge] }]}>
        {pushables[0]}
      </Animated.View>
      <Animated.View style={[styles.absolute, at(game.player.x - 1, game.player.y, tileSize), { transform: [{ translateX: drag.left.toward }, nudge] }]}>
        {pushables[1]}
      </Animated.View>
      <Animated.View style={[styles.absolute, at(game.player.x + 1, game.player.y, tileSize), { transform: [{ translateX: drag.right.toward }, nudge] }]}>
        {pushables[2]}
      </Animated.View>
      <Animated.View style={[styles.absolute, at(game.player.x, game.player.y + 1, tileSize), { transform: [{ translateY: drag.bottom.toward }, nudge] }]}>
        {pushables[3]}
      </Animated.View>

      <Animated.View style={[
        styles.absolute,
        at(game.player.x, game.player.y, tileSize),
        { transform: [{ translateY: drag.y }, { translateX: drag.x }, { scale: drag.scale }, nudge] },
      ]}>
        <Image style={tileStyle} source={playerSrc} />
      </Animated.View>
    </>
  );
});

const crateIcon = getIconSrc({ id: TileType.CRATE })!.icon;
const iceBlockIcon = getIconSrc({ id: TileType.ICE_BLOCK })!.icon;

/**
 * The preview of a pushable tile next to the player. The board hides those tiles while
 * the player is beside them, so the crate and ice block images stay mounted (shown by
 * opacity) and the element structure never changes: mounting a fresh image left the
 * tile blank for a frame after each move while it loaded.
 */
function getAdjacentTile(game: Game, offset: Offset, tileSize: number, tileStyle: ImageStyle, isValidMove: boolean) {
  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;
  const tile = isValidMove ? game.board.getTile(yPos, xPos, true) : undefined;
  const id = tile?.id;

  let other: React.ReactElement | null = null;
  if (tile && id === TileType.METAL_CRATE) {
    // Only the crates that will actually move; obstructed ones stay drawn by the board.
    const component = findMovingMetalCrates(game.board, { x: xPos, y: yPos }, offsetToDirection(offset));
    const icon = getIconSrc({ id: TileType.METAL_CRATE })!.icon;
    other = <>
      {component.map((p, idx) => (
        <Image
          key={idx}
          style={[tileStyle, { position: "absolute", left: (p.x - xPos) * tileSize, top: (p.y - yPos) * tileSize }]}
          source={icon}
        />
      ))}
    </>;
  } else if (tile && id === TileType.BOMB) {
    other = <BombBoardTile tile={tile} icon={getIconSrc(tile)!.icon} tileSize={tileSize} />;
  }

  return <>
    <Image style={[tileStyle, styles.absolute, { opacity: id === TileType.CRATE ? 1 : 0 }]} source={crateIcon} />
    <Image style={[tileStyle, styles.absolute, { opacity: id === TileType.ICE_BLOCK ? 1 : 0 }]} source={iceBlockIcon} />
    <View style={tileStyle}>{other}</View>
  </>;
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

/** Animated nodes derived from the drag offset, built once per tile size. */
function dragNodes(touch: TouchAnim, tileSize: number) {
  const t = tileSize;
  const clamp = "clamp" as const;
  // The drag along one side's direction (positive = toward that side), capped at a tile.
  const along = (value: Animated.Value, sign: 1 | -1) =>
    value.interpolate({ inputRange: [-t, t], outputRange: [-t * sign, t * sign], extrapolate: clamp });
  // How far the drag has moved toward a side, from 0 to a tile, and that as a 0..1 fraction.
  const side = (value: Animated.Value, sign: 1 | -1) => {
    const signed = along(value, sign);
    return {
      signed,
      toward: value.interpolate(sign > 0 ?
        { inputRange: [0, t], outputRange: [0, t], extrapolate: clamp } :
        { inputRange: [-t, 0], outputRange: [-t, 0], extrapolate: clamp }),
      fraction: value.interpolate(sign > 0 ?
        { inputRange: [0, t], outputRange: [0, 1], extrapolate: clamp } :
        { inputRange: [-t, 0], outputRange: [1, 0], extrapolate: clamp }),
    };
  };

  return {
    x: along(touch.x, 1),
    y: along(touch.y, 1),
    scale: touch.magnitude.interpolate({ inputRange: [0, t], outputRange: [0.975, 1.05], extrapolate: clamp }),
    top: side(touch.y, -1),
    left: side(touch.x, -1),
    right: side(touch.x, 1),
    bottom: side(touch.y, 1),
  };
}

type DragNodes = ReturnType<typeof dragNodes>;

function renderIceBlockPreview(preview: IceBlockPreview | null, tileSize: number, darkMode: boolean, drag: DragNodes, side: Side) {
  if (!preview) return null;

  const headX = side === "top" || side === "left" ? preview.topX : preview.bottomX;
  const headY = side === "top" || side === "left" ? preview.topY : preview.bottomY;
  const color = darkMode ? colors.OFF_WHITE : colors.BLUE_THEME.DARK_COLOR;
  const { signed, fraction } = drag[side];

  return (
    <>
      <Animated.View style={iceBlockLine(preview, tileSize, signed, fraction, side, color)} />
      <Animated.View style={iceBlockGhost(headX, headY, tileSize, fraction, color)} />
      <Animated.View style={iceBlockHead(headX, headY, tileSize, fraction, side, color)} />
    </>
  );
}

function at(xPos: number, yPos: number, tileSize: number): ViewStyle {
  return { left: xPos * tileSize, top: yPos * tileSize };
}

function optionTile(xPos: number, yPos: number, size: number, valid: boolean): ViewStyle {
  return {
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    opacity: valid ? 1 : 0,
  };
}

function optionTileInner(anim: Animated.Value, darkMode: boolean) {
  return {
    width: "100%",
    height: "100%",
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.3] }),
    borderColor: darkMode ? colors.OFF_WHITE : colors.DIM_GRAY,
    borderStyle: "solid",
    borderWidth: 1,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.95] }) }],
  } as const;
}

/** The line along an ice block's slide path, which shortens as the drag pulls in. */
function iceBlockLine(
  preview: IceBlockPreview,
  tileSize: number,
  signed: Animated.AnimatedInterpolation<number>,
  fraction: Animated.AnimatedInterpolation<number>,
  side: Side,
  color: string,
) {
  const lineSize = ICE_BLOCK_LINE_SIZE;
  let top: number | Animated.AnimatedNode = preview.topY * tileSize + tileSize / 2;
  let left: number | Animated.AnimatedNode = preview.topX * tileSize + tileSize / 2;
  let width: number | Animated.AnimatedNode = Math.max(lineSize, preview.width * tileSize);
  let height: number | Animated.AnimatedNode = Math.max(lineSize, preview.height * tileSize);

  if (side === "top") {
    left -= lineSize / 2;
    top += tileSize / 4; // Leave room for the head.
    height = Animated.subtract(height - tileSize / 4, signed);
  } else if (side === "left") {
    top -= lineSize / 2;
    left += tileSize / 4;
    width = Animated.subtract(width - tileSize / 4, signed);
  } else if (side === "bottom") {
    left -= lineSize / 2;
    top = Animated.add(top, signed);
    height = Animated.subtract(height - tileSize / 4, signed);
  } else {
    top -= lineSize / 2;
    left = Animated.add(left, signed);
    width = Animated.subtract(width - tileSize / 4, signed);
  }

  return { position: "absolute", top, left, width, height, backgroundColor: color, opacity: fraction } as const;
}

function iceBlockGhost(xPos: number, yPos: number, tileSize: number, fraction: Animated.AnimatedInterpolation<number>, color: string) {
  const size = tileSize * 0.8; // Block size for pushables
  return {
    position: "absolute",
    left: xPos * tileSize + tileSize * 0.1,
    top: yPos * tileSize + tileSize * 0.1,
    width: size,
    height: size,
    backgroundColor: color,
    opacity: Animated.multiply(fraction, 0.5),
  } as const;
}

function iceBlockHead(xPos: number, yPos: number, tileSize: number, fraction: Animated.AnimatedInterpolation<number>, side: Side, color: string) {
  const size = tileSize / 4;
  return {
    position: "absolute",
    left: xPos * tileSize + tileSize / 2 - size,
    top: yPos * tileSize + tileSize / 2 - size,
    width: 0,
    height: 0,
    borderWidth: size,
    borderStyle: "solid",
    borderTopColor: side === "bottom" ? color : "transparent",
    borderLeftColor: side === "right" ? color : "transparent",
    borderRightColor: side === "left" ? color : "transparent",
    borderBottomColor: side === "top" ? color : "transparent",
    opacity: fraction,
  } as const;
}

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
  },
});
