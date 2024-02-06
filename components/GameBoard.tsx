import { View, Dimensions, Image, Pressable, Text, Platform, StyleSheet } from "react-native";
import React, { useContext } from "react";
import GlobalContext from "../GlobalContext";

import { colors } from "../Theme";
import { TileIcon } from "../assets/Icons";
import { Board, BoardTile, BombTile, TileType } from "../util/types";
import { calcBoardTileSize, getIconSrc } from "../util/board";

const win = Dimensions.get("window");

interface Props {
  board: Board,
  tileCallback?: (yPos: number, xPos: number, tileType: TileType) => void,
  overrideTileSize?: number,
  children?: React.ReactNode,
}

export default function GameBoard({
  board,
  tileCallback,
  overrideTileSize,
  children,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  const boardHeight = board.length;
  const boardWidth = board[0].length;

  const tileSize = overrideTileSize ? overrideTileSize : calcBoardTileSize(boardWidth, boardHeight, win);
  const useSvg = Platform.OS === "ios";

  function getTile(tile: BoardTile, i: number, j: number) {
    // We need to know oddTile (board is checkered color-wise) and the tile type
    // regardless of whether the tile will be a wall, entity, or regular tile.
    const oddTile = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j));
    const pressCallback = tileCallback ? () => { tileCallback(i, j, tile.id) } : undefined;

    if (tile.id === TileType.WALL) {
      // Wall tiles are just Views with border and background. We apply
      // the border based on adjacent walls.
      const borderColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.65) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.8);
      const fillColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.5) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.65);

      const borders = {
        borderTopWidth: i > 0 && board[i - 1][j].id === TileType.WALL ? 0 : 5,
        borderLeftWidth: j > 0 && board[i][j - 1].id === TileType.WALL ? 0 : 5,
        borderBottomWidth: i + 1 < boardHeight && board[i + 1][j].id === TileType.WALL ? 0 : 5,
        borderRightWidth: j + 1 < boardWidth && board[i][j + 1].id === TileType.WALL ? 0 : 5,
      };

      if (!tileCallback) {
        return <View key={j} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]} />;
      } else {
        return <Pressable
          key={j}
          style={[styles.wallTile(fillColor, borderColor, tileSize), borders]}
          onPress={pressCallback}
          // @ts-expect-error
          touchSoundDisabled={true}
          android_disableSound={true}
        />;
      }
    }

    // Regular tiles are sized like wall tiles but are Image elements. All
    // tiles have png sources so the checkered background colors can show through.
    const icon = getIconSrc(tile);
    const bgColor = oddTile ? colors.BLUE_THEME.MAIN_TRANSPARENT(0.03) : colors.BLUE_THEME.MAIN_TRANSPARENT(0.14);

    if (tile.id === TileType.EMPTY) {
      if (!tileCallback) {
        return <View key={j} style={styles.tile(bgColor, tileSize)} />;
      } else {
        return <Pressable
          key={j}
          style={styles.tile(bgColor, tileSize)}
          onPress={pressCallback}
          // @ts-expect-error
          touchSoundDisabled={true}
          android_disableSound={true}
        />;
      }
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

      if (!tileCallback) {
        return <View key={j} style={styles.relative}>{contents}</View>;
      } else {
        return <Pressable
          key={j}
          onPress={pressCallback}
          // @ts-expect-error
          touchSoundDisabled={true}
          android_disableSound={true}
          style={styles.relative}
        >
          {contents}
        </Pressable>;
      }
    } else {
      // Again we need a quick if to determine whether tiles should be 
      // wrapped in pressable or not.

      if (tileCallback) {
        return <Pressable
          key={j}
          onPress={pressCallback}
          // @ts-expect-error  
          touchSoundDisabled={true}
          android_disableSound={true}
        >
          {tileGraphic}
        </Pressable>;
      } else {
        return tileGraphic;
      }
    }
  }

  return (
    <View style={[
      styles.board,
      {
        borderRadius: tileSize / 5,
        borderColor: colors.BLUE_THEME.MAIN_COLOR,
        backgroundColor: (darkMode) ? "#000" : "#fff",
      }
    ]}>
      {board.map((row, y) =>
        <View key={y} style={styles.boardRow}>
          {row.map((tile, x) => getTile(tile, y, x))}
        </View>
      )}
      {children}
    </View>
  );
}

function isEven(num: number) { return num % 2 === 0; }

const styles = StyleSheet.create<any>({
  board: {
    position: "relative",
    borderWidth: 1,
    // borderRadius: 5,
    overflow: "hidden",
  },
  boardRow: {
    flexDirection: "row",
    margin: 0,
  },
  relative: {
    position: "relative",
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