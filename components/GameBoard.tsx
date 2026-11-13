import { memo, useContext, useMemo } from "react";
import { Image, ImageStyle, Platform, StyleSheet, Text, TextStyle, View, ViewStyle, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { colors } from "../Theme";
import { TileIcon } from "../assets/Icons";
import { PositionSet } from "../util/Set";
import { calcBoardTileSize, FlatBoard, getIconSrc, LayeredBoard } from "../util/board";
import { findConnectedMetalComponent, isPushable, Position } from "../util/logic";
import { BombTile, FlatTile, LayeredTile, TileType } from "../util/types";
import DiamondGlint from "./DiamondGlint";

interface Props {
  board: FlatBoard | LayeredBoard,
  playerPosition?: Position,  // If provided, this means the adjacent tiles will be displayed by the player component.
  overrideTileSize?: number,
  children?: React.ReactNode,
}

/**
 * Draws a board. Memoized: on the play page, everything that moves (the player, drag
 * previews, jump indicators) is drawn in an overlay instead of as children, so the
 * board only re-renders when the board or player position changes.
 */
export default memo(function GameBoard({
  board,
  playerPosition,
  overrideTileSize,
  children,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const win = useWindowDimensions();

  const tileSize = overrideTileSize ? overrideTileSize : calcBoardTileSize(board.width, board.height, win);
  const useSvg = Platform.OS === "ios";
  const isFlatBoard = board instanceof FlatBoard;

  // Precompute which tiles will be rendered by the Player component (avoid BFS per tile render)
  const handledByPlayer = useMemo(() => {
    const handled = new PositionSet(board.width);
    if (!playerPosition || !(board instanceof LayeredBoard)) return handled;

    const offsets = [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];

    offsets.forEach(offset => {
      const x = playerPosition.x + offset.dx;
      const y = playerPosition.y + offset.dy;
      const tile = board.getTile(y, x, true);

      const pushable = [TileType.CRATE, TileType.METAL_CRATE, TileType.BOMB, TileType.ICE_BLOCK].includes(tile.id);
      if (!pushable) return;

      if (!isPushable(board, { x, y }, offset)) return;

      if (tile.id === TileType.METAL_CRATE) {
        const component = findConnectedMetalComponent(board, { x, y });
        component.forEach(p => handled.add(p));
      } else {
        handled.add({ x, y });
      }
    });

    return handled;
  }, [board, playerPosition]);

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

    // Regular tiles are sized like wall tiles but are Image elements. All
    // tiles have png sources so the checkered background colors can show through.
    const iconSrc = getIconSrc(tile, darkMode);
    const bgColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.03) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.14);

    // Render an empty tile if we are directly adjacent to the player's position. Board will be a LayeredBoard since this won't be used for EditLevel.
    if (tile.id === TileType.EMPTY || willPlayerComponentHandleRender(board as LayeredBoard, j, i, playerPosition, tile.id, handledByPlayer)) {
      return <View key={j} style={styles.tile(bgColor, tileSize)} />;
    }

    // Only empty tiles lack an icon, and those are handled above. Draw unknown tiles
    // (e.g. from a newer app version) as empty rather than crashing the page.
    if (!iconSrc) {
      console.warn("No icon for tile:", JSON.stringify(tile));
      return <View key={j} style={styles.tile(bgColor, tileSize)} />;
    }

    const tileGraphic = useSvg ?
      <TileIcon key={j} bgColor={bgColor} tileSize={tileSize} tileData={tile} /> :
      <Image key={j} style={styles.tile(bgColor, tileSize, iconSrc.rotation)} source={iconSrc.icon} />;

    if (tile.id === TileType.BOMB) {
      const contents = <>
        {tileGraphic}
        <View style={[styles.entityContainer(tileSize), styles.bombContainer]}>
          <Text style={[styles.bombText(tileSize)]} allowFontScaling={false}>
            {(tile as BombTile).fuse}
          </Text>
        </View>
      </>;

      return <View key={j} style={styles.relative}>{contents}</View>;
    } else if (tile.id === TileType.DIAMOND) {
      const contents = <>
        {tileGraphic}
        <View style={styles.entityContainer(tileSize)}>
          <DiamondGlint tileSize={tileSize} />
        </View>
      </>;

      return <View key={j} style={styles.relative}>{contents}</View>;
    } else {
      return tileGraphic;
    }
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

function isEven(num: number) { return num % 2 === 0; }

function willPlayerComponentHandleRender(_board: LayeredBoard, x: number, y: number, playerPosition: Position | undefined, _tile_id: TileType, handled: PositionSet) {
  return (
    !!playerPosition &&
    handled.has({ x, y })
  );
}

// function isAdjacent(x1: number, y1: number, x2: number, y2: number) {
//   const dx = Math.abs(x1 - x2);
//   const dy = Math.abs(y1 - y2);
//   return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
// }

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
  bombText: (size: number): TextStyle => ({
    fontSize: size * 0.3,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
  }),
};
