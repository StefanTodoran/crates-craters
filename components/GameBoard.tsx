import { memo, useContext } from "react";
import { Image, ImageStyle, Platform, StyleSheet, Text, TextStyle, View, ViewStyle, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { colors, graphics } from "../Theme";
import { TileIcon } from "../assets/Icons";
import { calcBoardTileSize, FlatBoard, getIconSrc, LayeredBoard } from "../util/board";
import { movableTiles } from "../util/logic";
import { BombTile, FlatTile, LayeredTile, TileType } from "../util/types";
import FuseSpark from "./FuseSpark";
import TileGlint from "./TileGlint";
import { AnimatedFlagIcon, AnimatedKeyIcon, AnimatedMetalCrateIcon } from "./AnimatedTiles";

interface Props {
  board: FlatBoard | LayeredBoard,
  hidePushables?: boolean, // The play page's Player overlay draws every pushable tile (see Player.tsx).
  overrideTileSize?: number,
  animated?: boolean, // Animate tiles (flag, sheens, glints, fuse sparks): only the play and solution pages.
  children?: React.ReactNode,
}

/**
 * Draws a board. Memoized: on the play page, everything that moves (the player, pushable
 * tiles, drag previews, jump indicators) is drawn in an overlay instead of as children,
 * so the board only re-renders when the board changes.
 */
export default memo(function GameBoard({
  board,
  hidePushables,
  overrideTileSize,
  animated,
  children,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const win = useWindowDimensions();

  const tileSize = overrideTileSize ? overrideTileSize : calcBoardTileSize(board.width, board.height, win);
  const isFlatBoard = board instanceof FlatBoard;

  function getTile(tile: FlatTile, i: number, j: number) {
    // We need to know oddTile (board is checkered color-wise) and the tile type
    // regardless of whether the tile will be a wall, entity, or regular tile.
    const oddTile = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j));

    if (tile.id === TileType.WALL) {
      // Wall tiles are just Views with border and background. We apply
      // the border based on adjacent walls.
      const borderColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.65) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.8);
      const fillColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.5) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.65);

      const adjacentWalls = board.findAdjacentWalls(i, j);
      const borders = {
        borderTopWidth: adjacentWalls.top ? 0 : 5,
        borderLeftWidth: adjacentWalls.left ? 0 : 5,
        borderBottomWidth: adjacentWalls.bottom ? 0 : 5,
        borderRightWidth: adjacentWalls.right ? 0 : 5,
      };

      return <View key={j} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]} />;
    }

    // Regular tiles are sized like wall tiles. All tile graphics are transparent
    // around the edges so the checkered background colors can show through.
    const bgColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.03) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.14);

    // Pushables are only ever foreground tiles, so the background layer is unaffected.
    if (tile.id === TileType.EMPTY || (hidePushables && movableTiles.includes(tile.id))) {
      return <View key={j} style={styles.tile(bgColor, tileSize)} />;
    }

    return <TileGraphic key={j} tile={tile} x={j} y={i} tileSize={tileSize} bgColor={bgColor} darkMode={darkMode} animated={animated} />;
  }

  return (
    <View style={[
      styles.board,
      {
        borderRadius: tileSize / 5,
        backgroundColor: (darkMode) ? "#000" : "#fff",
      }
    ]}>
      {
        isFlatBoard ?
          board.map((row, y) => <View key={y} style={styles.boardRow}>
            {(row as FlatTile[]).map((tile, x) => getTile(tile, y, x))}
          </View>)
          :
          <>
            <View style={styles.absolute}>
              {board.map((row, y) => <View key={y} style={styles.boardRow}>
                {(row as LayeredTile[]).map((tile, x) => getTile(tile.background, y, x))}
              </View>)}
            </View>
            {board.map((row, y) => <View key={y} style={styles.boardRow}>
              {(row as LayeredTile[]).map((tile, x) => getTile(tile.foreground, y, x))}
            </View>)}
          </>
      }
      {children}
    </View>
  );
});

// Coin glints: white and larger than the diamond's, kept over the coin's face.
const COIN_GLINT_SIZE: [number, number] = [0.2, 0.32];

function isEven(num: number) { return num % 2 === 0; }

interface TileGraphicProps {
  tile: FlatTile,
  x: number,
  y: number,
  tileSize: number,
  bgColor?: string,
  darkMode: boolean,
  animated?: boolean,
}

/**
 * One non-wall, non-empty tile, drawn the same way by the board and by the play page's
 * overlay (which draws the pushable tiles). Memoized on the tile's contents, since the
 * board is cloned each move and so its tile objects are always new.
 */
export const TileGraphic = memo(function TileGraphic({ tile, x, y, tileSize, bgColor = "transparent", darkMode, animated }: TileGraphicProps) {
  const iconSrc = getIconSrc(tile, darkMode);
  const useSvg = Platform.OS === "ios";

  // Only empty tiles lack an icon. Draw unknown tiles (e.g. from a newer app version)
  // as empty rather than crashing the page.
  if (!iconSrc) {
    console.warn("No icon for tile:", JSON.stringify(tile));
    return <View style={styles.tile(bgColor, tileSize)} />;
  }

  // Bombs always use the SVG: their fuse is drawn to the remaining countdown.
  const tileGraphic = useSvg || tile.id === TileType.BOMB ?
    <TileIcon bgColor={bgColor} tileSize={tileSize} tileData={tile} /> :
    <Image style={styles.tile(bgColor, tileSize, iconSrc.rotation)} source={iconSrc.icon} />;

  if (animated) {
    // Stagger sheens diagonally so a group of crates shimmers in a wave instead of in unison.
    const phase = ((x + y) * 0.06) % 1;
    if (tile.id === TileType.FLAG) return <AnimatedFlagIcon tileSize={tileSize} bgColor={bgColor} />;
    if (tile.id === TileType.KEY) return <AnimatedKeyIcon tileSize={tileSize} bgColor={bgColor} phase={phase} />;
    if (tile.id === TileType.METAL_CRATE) return <AnimatedMetalCrateIcon tileSize={tileSize} bgColor={bgColor} phase={phase} />;
  }

  if (tile.id === TileType.BOMB) {
    return <View style={styles.relative}>
      {tileGraphic}
      <View style={[styles.entityContainer(tileSize), styles.bombContainer]}>
        <Text style={[styles.bombText(tileSize)]} allowFontScaling={false}>
          {(tile as BombTile).fuse}
        </Text>
      </View>
      {animated && <FuseSpark tileSize={tileSize} fuse={(tile as BombTile).fuse} />}
    </View>;
  } else if (tile.id === TileType.DIAMOND && animated) {
    return <View style={styles.relative}>
      {tileGraphic}
      <View style={styles.entityContainer(tileSize)}>
        <TileGlint tileSize={tileSize} />
      </View>
    </View>;
  } else if (tile.id === TileType.COIN && animated) {
    // Coins sit centered in the tile (no entityContainer padding like the diamond).
    return <View style={styles.relative}>
      {tileGraphic}
      <View style={styles.overlay(tileSize)}>
        <TileGlint tileSize={tileSize} glintCount={3} source={graphics.COIN_GLINT} sizeRange={COIN_GLINT_SIZE} inset={0.2} />
      </View>
    </View>;
  }
  return tileGraphic;
}, (prev, next) =>
  prev.x === next.x && prev.y === next.y && prev.tileSize === next.tileSize && prev.bgColor === next.bgColor &&
  prev.darkMode === next.darkMode && prev.animated === next.animated &&
  JSON.stringify(prev.tile) === JSON.stringify(next.tile)
);

const staticStyles = StyleSheet.create({
  board: {
    position: "relative",
    borderWidth: 1,
    borderColor: colors.BLUE_THEME.MAIN_COLOR,
    overflow: "hidden",
  },
  boardRow: {
    flexDirection: "row",
    margin: 0,
  },
  relative: {
    position: "relative",
  },
  absolute: {
    position: "absolute",
  },
  bombContainer: {
    paddingTop: "17.5%",
    paddingRight: "5%",
  },
});

const styles = {
  ...staticStyles,
  wallTile: (bgColor: string, borderColor: string, size: number): ViewStyle => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderStyle: "solid",
  }),
  tile: (bgColor: string, size: number, rotation: number = 0): ImageStyle & ViewStyle => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
    transform: [{ rotate: `${rotation}deg` }],
  }),
  entityContainer: (size: number): ViewStyle => ({
    position: "absolute",
    width: size,
    height: size,
    paddingTop: "17.5%",
    paddingRight: "5%",
    justifyContent: "center",
    alignItems: "center",
  }),
  overlay: (size: number): ViewStyle => ({
    position: "absolute",
    width: size,
    height: size,
  }),
  bombText: (size: number): TextStyle => ({
    fontSize: size * 0.3,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
  }),
};
