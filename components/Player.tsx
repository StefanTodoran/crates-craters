import React, { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleSheet, View, ViewStyle } from "react-native";
import { colors, graphics } from "../Theme";
import { PositionSet } from "../util/Set";
import { Game, findMovingTiles, isValidMove, movableTiles, pushIceBlock } from "../util/logic";
import { Direction, FlatTile, Offset, TileType, offsetToDirection } from "../util/types";
import { TouchAnim } from "../util/useGameInput";
import { TileGraphic } from "./GameBoard";

const ICE_BLOCK_LINE_SIZE = 5;

interface Props {
  game: Game,
  touch: TouchAnim,
  darkMode: boolean,
  tileSize: number,
}

type Side = "top" | "left" | "right" | "bottom";

/**
 * Draws the player, every pushable tile, and the drag preview: the player and the tiles
 * a move in the drag direction would push follow the finger, and sliding ice blocks show
 * their path. The drag offset comes in as Animated values, so this only re-renders when
 * the game changes.
 *
 * The board leaves all pushable tiles to this overlay (rather than just the ones that
 * can move right now), so no tile ever switches between being drawn by the board and by
 * the overlay as the player walks around, and each tile is drawn exactly once however
 * many directions would move it (e.g. a metal crate group wrapped around the player).
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

  const [options, iceBlockPreviews] = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: React.ReactElement[] = [];
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

      const iceBlockPreview = getIceBlockPreview(game, offset, shouldHighlight);
      newIceBlockPreviews.push(iceBlockPreview);
    });

    return [newOptions, newIceBlockPreviews];
  }, [game, tileSize, darkMode, optionInnerStyle]);

  const pushables = useMemo(() => findPushables(game), [game]);

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

      {/* Every pushable tile. Each follows the drag toward any side that would move it. */}
      {pushables.map(({ key, tile, x, y, moves }) => (
        <Animated.View key={key} style={[styles.absolute, at(x, y, tileSize), {
          transform: [{ translateX: drag.xToward[moves.x] }, { translateY: drag.yToward[moves.y] }, nudge],
        }]}>
          <TileGraphic tile={tile} x={x} y={y} tileSize={tileSize} darkMode={darkMode} animated />
        </Animated.View>
      ))}

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

/** Which sides of an axis a drag toward would move a tile: bit 1 = the negative side (left / top), bit 2 = the positive one. */
type AxisMask = 0 | 1 | 2 | 3;

interface Pushable {
  key: string,
  tile: FlatTile,
  x: number,
  y: number,
  moves: { x: AxisMask, y: AxisMask },
}

/**
 * Every pushable tile on the board, with the drag directions that would move it.
 * Keyed by type and order rather than position, so after a push the moved tile reuses an
 * existing element of its type instead of mounting a fresh one (which can draw blank for
 * a frame while its image or SVG loads).
 */
function findPushables(game: Game): Pushable[] {
  const moving = [Direction.UP, Direction.LEFT, Direction.RIGHT, Direction.DOWN].map(direction => {
    const set = new PositionSet(game.board.width);
    findMovingTiles(game, direction).forEach(p => set.add(p));
    return set;
  });
  const [up, left, right, down] = moving;

  const counts = new Map<TileType, number>();
  const pushables: Pushable[] = [];
  for (let y = 0; y < game.board.height; y++) {
    for (let x = 0; x < game.board.width; x++) {
      const tile = game.board.getTile(y, x, true);
      if (!movableTiles.includes(tile.id)) continue;

      const n = counts.get(tile.id) ?? 0;
      counts.set(tile.id, n + 1);
      const p = { x, y };
      pushables.push({
        key: `${tile.id}-${n}`,
        tile,
        x,
        y,
        moves: {
          x: ((left.has(p) ? 1 : 0) | (right.has(p) ? 2 : 0)) as AxisMask,
          y: ((up.has(p) ? 1 : 0) | (down.has(p) ? 2 : 0)) as AxisMask,
        },
      });
    }
  }
  return pushables;
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

  const top = side(touch.y, -1);
  const left = side(touch.x, -1);
  const right = side(touch.x, 1);
  const bottom = side(touch.y, 1);

  return {
    x: along(touch.x, 1),
    y: along(touch.y, 1),
    scale: touch.magnitude.interpolate({ inputRange: [0, t], outputRange: [0.975, 1.05], extrapolate: clamp }),
    top,
    left,
    right,
    bottom,
    // A tile's offset on each axis, indexed by AxisMask: it follows the drag toward each
    // side a move would push it. At most one side of an axis is ever dragged toward.
    xToward: [0, left.toward, right.toward, Animated.add(left.toward, right.toward)],
    yToward: [0, top.toward, bottom.toward, Animated.add(top.toward, bottom.toward)],
  };
}

type DragNodes = ReturnType<typeof dragNodes>;

function renderIceBlockPreview(preview: IceBlockPreview | null, tileSize: number, darkMode: boolean, drag: DragNodes, side: Side) {
  if (!preview) return null;

  const headX = side === "top" || side === "left" ? preview.topX : preview.bottomX;
  const headY = side === "top" || side === "left" ? preview.topY : preview.bottomY;
  const color = darkMode ? colors.OFF_WHITE : colors.BLUE_THEME.DARK_COLOR;
  const { signed, fraction } = drag[side];

  // The line and head fade together in one layer, so the line can tuck under the head
  // (no pixel-rounding seam between them) without the overlap drawing darker.
  return (
    <>
      <Animated.View style={iceBlockGhost(headX, headY, tileSize, fraction, color)} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fraction }]}>
        <Animated.View style={iceBlockLine(preview, tileSize, signed, side, color)} />
        <View style={iceBlockHead(headX, headY, tileSize, side, color)} />
      </Animated.View>
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
  side: Side,
  color: string,
) {
  const lineSize = ICE_BLOCK_LINE_SIZE;
  const overlap = 2; // Runs this far under the head.
  let top: number | Animated.AnimatedNode = preview.topY * tileSize + tileSize / 2;
  let left: number | Animated.AnimatedNode = preview.topX * tileSize + tileSize / 2;
  let width: number | Animated.AnimatedNode = Math.max(lineSize, preview.width * tileSize);
  let height: number | Animated.AnimatedNode = Math.max(lineSize, preview.height * tileSize);

  if (side === "top") {
    left -= lineSize / 2;
    top += tileSize / 4 - overlap; // Leave room for the head.
    height = Animated.subtract(height - tileSize / 4 + overlap, signed);
  } else if (side === "left") {
    top -= lineSize / 2;
    left += tileSize / 4 - overlap;
    width = Animated.subtract(width - tileSize / 4 + overlap, signed);
  } else if (side === "bottom") {
    left -= lineSize / 2;
    top = Animated.add(top, signed);
    height = Animated.subtract(height - tileSize / 4 + overlap, signed);
  } else {
    top -= lineSize / 2;
    left = Animated.add(left, signed);
    width = Animated.subtract(width - tileSize / 4 + overlap, signed);
  }

  return { position: "absolute", top, left, width, height, backgroundColor: color } as const;
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

function iceBlockHead(xPos: number, yPos: number, tileSize: number, side: Side, color: string): ViewStyle {
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
  };
}

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
  },
});
