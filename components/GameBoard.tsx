import { useContext } from "react";
import { View, Dimensions, Image, Text, Platform, StyleSheet } from "react-native";

import { colors } from "../Theme";
import GlobalContext from "../GlobalContext";

import { TileIcon } from "../assets/Icons";
import { FlatBoard, LayeredBoard, TileType, BombTile, FlatTile, LayeredTile } from "../util/types";
import { calcBoardTileSize, getIconSrc } from "../util/board";

const win = Dimensions.get("window");

interface Props {
  board: FlatBoard | LayeredBoard,
  overrideTileSize?: number,
  children?: React.ReactNode,
}

export default function GameBoard({
  board,
  overrideTileSize,
  children,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  const tileSize = overrideTileSize ? overrideTileSize : calcBoardTileSize(board.width, board.height, win);
  const useSvg = Platform.OS === "ios";
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

    // Regular tiles are sized like wall tiles but are Image elements. All
    // tiles have png sources so the checkered background colors can show through.
    const icon = getIconSrc(tile);
    const bgColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.03) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.14);

    if (tile.id === TileType.EMPTY) {
      return <View key={j} style={styles.tile(bgColor, tileSize)} />;
    }

    const tileGraphic = useSvg ?
      <TileIcon key={j} bgColor={bgColor} tileSize={tileSize} tileData={tile} /> :
      <Image key={j} style={styles.tile(bgColor, tileSize)} source={icon} />;

    if (tile.id === TileType.BOMB) {
      const contents = <>
        {tileGraphic}
        <View style={styles.entityContainer(tileSize)}>
          <Text style={[styles.entity, { fontSize: tileSize * 0.3 }]} allowFontScaling={false}>
            {(tile as BombTile).fuse}
          </Text>
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
}

function isEven(num: number) { return num % 2 === 0; }

const styles = StyleSheet.create<any>({
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
  wallTile: (bgColor: string, borderColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderStyle: "solid",
    // borderWidth: 5,
  }),
  tile: (bgColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
  entityContainer: (size: number) => ({
    position: "absolute",
    width: size,
    height: size,
    paddingTop: "17.5%",
    paddingRight: "5%",
    justifyContent: "center",
    alignItems: "center",
  }),
  entity: {
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
  },
});