import { View, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import React from "react";

import { tiles, icon_src, calcTileSize } from '../Game';
import { colors, graphics } from '../Theme';
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
      const tileType = tiles[board[i][j]];
      const pressCallback = () => { tileCallback(i, j, tileType) };

      if (tileType === "wall") {
        // Wall tiles are just Views with border and background.
        const borderColor = oddTile ? colors.MEDIUM_WALL : colors.DARK_WALL;
        const fillColor = oddTile ? colors.LIGHT_WALL : colors.MEDIUM_WALL;

        if (!tileCallback) {
          row.push(<View key={`tile<${i},${j}>`} style={styles.wallTile(fillColor, borderColor, tileSize)} />);
        } else {
          row.push(<Pressable key={`tile<${i},${j}>`} style={styles.wallTile(fillColor, borderColor, tileSize)} onPress={pressCallback} />);
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
            <Image style={styles.tile(bgColor, tileSize)} source={icon}/>
          </Pressable>);
        }
      }
    }
    tilesBoard.push(<View key={`row<${i}>`} style={{ flexDirection: 'row', margin: 0 }}>{row}</View>);
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
    borderWidth: 5,
  }),
  tile: (bgColor, size) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
});