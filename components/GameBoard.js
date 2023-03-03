import { View, StyleSheet, Dimensions, Image, Pressable, Text } from 'react-native';
import React from "react";

import { tiles, getTileType, icon_src, calcTileSize, getTileEntityData } from '../Game';
import { colors } from '../Theme';
const win = Dimensions.get('window');

export default function GameBoard({ children, board, tileCallback }) {
  const tilesBoard = [];
  const boardHeight = board.length; const boardWidth = board[0].length;
  const tileSize = calcTileSize(boardWidth, boardHeight, win);

  for (let i = 0; i < boardHeight; i++) {
    const row = [];
    for (let j = 0; j < boardWidth; j++) {
      // We need to know oddTile (board is checkered color-wise) and the tile type
      // regardless of whether the tile will be a wall or regular tile.
      const oddTile = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j));
      const tileType = getTileType(board[i][j]);
      const pressCallback = () => { tileCallback(i, j, tileType) };

      if (tileType === "wall") {
        // Wall tiles are just Views with border and background. We apply
        // the border based on adjacent walls.
        const borderColor = oddTile ? colors.MEDIUM_WALL : colors.DARK_WALL;
        const fillColor = oddTile ? colors.LIGHT_WALL : colors.MEDIUM_WALL;

        const borders = {
          borderTopWidth: i > 0 && tiles[board[i - 1][j]] === "wall" ? 0 : 5,
          borderBottomWidth: i + 1 < boardHeight && tiles[board[i + 1][j]] === "wall" ? 0 : 5,
          borderLeftWidth: j > 0 && tiles[board[i][j - 1]] === "wall" ? 0 : 5,
          borderRightWidth: j + 1 < boardWidth && tiles[board[i][j + 1]] === "wall" ? 0 : 5,
        };

        if (!tileCallback) {
          row.push(<View key={`tile<${i},${j}>`} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]} />);
        } else {
          row.push(<Pressable key={`tile<${i},${j}>`} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]} onPress={pressCallback} />);
        }
      } else if (tileType === "bomb") {
        // Bomb tiles are special, in that unlike walls, door or other tiles
        // they carry associated data (e.g. fuse time). They aren't represented as just
        // a number but as a string, so we need to get that data and display it.

        const fuse = getTileEntityData(board[i][j]).fuse;

        // Mostly this code follows from the regular tile code though.
        const icon = icon_src(tileType);
        const bgColor = oddTile ? colors.LIGHT_TILE : colors.DARK_TILE;

        if (!tileCallback) {
          row.push(<View key={`tile<${i},${j}>`} style={{ position: "relative" }}>
            <Image style={styles.tile(bgColor, tileSize)} source={icon} />
            <View style={styles.entityContainer(tileSize)}>
              <Text style={[styles.entity, { color: colors.LIGHT_COLOR }]}>{fuse}</Text>
            </View>
          </View>);
        } else {
          row.push(<Pressable key={`tile<${i},${j}>`} onPress={pressCallback} style={{ position: "relative" }}>
            <Image style={styles.tile(bgColor, tileSize)} source={icon} />
            <View style={styles.entityContainer(tileSize)}>
              <Text style={[styles.entity, { color: colors.LIGHT_COLOR }]}>{fuse}</Text>
            </View>
          </Pressable>);
        }
      } else {
        // Regular tiles are sized like wall tiles but are Image elements. All
        // tiles have png sources so the checkered background colors can show through.
        const icon = icon_src(tileType);
        const bgColor = oddTile ? colors.LIGHT_TILE : colors.DARK_TILE;

        if (!tileCallback) {
          row.push(<Image key={`tile<${i},${j}>`} style={styles.tile(bgColor, tileSize)} source={icon} />);
        } else {
          row.push(<Pressable key={`tile<${i},${j}>`} onPress={pressCallback}>
            <Image style={styles.tile(bgColor, tileSize)} source={icon} />
          </Pressable>);
        }
      }
    }

    // Not even the slightest clue why but every other row has a tiny 1px gap vertically if we don't
    // add this scuffed litte negative marginTop... React Native boggles the mind sometimes ¯\_(ツ)_/¯
    tilesBoard.push(<View key={`row<${i}>`} style={{ flexDirection: 'row', margin: 0, marginTop: -0.001 }}>{row}</View>);
  }

  return (
    <View style={styles.board(colors)}>
      {tilesBoard}
      {children}
    </View>
  );
}

function isEven(num) { return num % 2 === 0; }

const styles = StyleSheet.create({
  board: (theme) => ({
    position: "relative",
    borderWidth: 1,
    borderColor: theme.MAIN_COLOR,
    borderRadius: 5,
    overflow: "hidden",
  }),
  wallTile: (bgColor, borderColor, size) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
    borderColor: borderColor,
    borderStyle: "solid",
    // borderWidth: 5,
  }),
  tile: (bgColor, size) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
  entityContainer: (size) => ({
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
  },
});