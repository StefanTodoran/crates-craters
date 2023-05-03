import { View, StyleSheet, Dimensions, Image, Pressable, Text } from 'react-native';
import React from "react";

import { tiles, getTileType, icon_src, calcTileSize, getTileEntityData } from '../Game';
import { colors } from '../Theme';
const win = Dimensions.get('window');

export default function GameBoard({ children, board, tileCallback, overrideTileSize, rowCorrect }) {
  const tilesBoard = [];
  const boardHeight = board.length; const boardWidth = board[0].length;
  const tileSize = overrideTileSize ? overrideTileSize : calcTileSize(boardWidth, boardHeight, win);

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
        const borderColor = oddTile ? colors.MAIN_BLUE_TRANSPARENT(0.65) : colors.MAIN_BLUE_TRANSPARENT(0.8);
        const fillColor = oddTile ? colors.MAIN_BLUE_TRANSPARENT(0.5) : colors.MAIN_BLUE_TRANSPARENT(0.65);

        const borders = {
          borderTopWidth: i > 0 && tiles[board[i - 1][j]] === "wall" ? 0 : 5,
          borderBottomWidth: i + 1 < boardHeight && tiles[board[i + 1][j]] === "wall" ? 0 : 5,
          borderLeftWidth: j > 0 && tiles[board[i][j - 1]] === "wall" ? 0 : 5,
          borderRightWidth: j + 1 < boardWidth && tiles[board[i][j + 1]] === "wall" ? 0 : 5,
        };

        if (!tileCallback) {
          row.push(<View key={`tile<${i},${j}>`} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]} />);
        } else {
          row.push(<Pressable key={`tile<${i},${j}>`} style={[styles.wallTile(fillColor, borderColor, tileSize), borders]}
            onPress={pressCallback} touchSoundDisabled={true} android_disableSound={true} />);
        }
      } else {
        // Regular tiles are sized like wall tiles but are Image elements. All
        // tiles have png sources so the checkered background colors can show through.
        const icon = icon_src(tileType);
        const bgColor = oddTile ? colors.MAIN_BLUE_TRANSPARENT(0.03) : colors.MAIN_BLUE_TRANSPARENT(0.14);

        if (tileType === "bomb") {
          // Bomb tiles are special, in that unlike walls, door or other tiles
          // they carry associated data (e.g. fuse time). They aren't represented as just
          // a number but as a string, so we need to get that data and display it.

          const fuseData = getTileEntityData(board[i][j]).fuse;
          const contents = <>
            <Image style={styles.tile(bgColor, tileSize)} source={icon} />
            <View style={styles.entityContainer(tileSize)}>
              <Text style={[styles.entity(tileSize / 3)]}>{fuseData}</Text>
            </View>
          </>;

          if (!tileCallback) {
            row.push(<View key={`tile<${i},${j}>`} style={{ position: "relative" }}>
              {contents}
            </View>);
          } else {
            row.push(<Pressable key={`tile<${i},${j}>`} onPress={pressCallback}
              touchSoundDisabled={true} android_disableSound={true} style={{ position: "relative" }}>
              {contents}
            </Pressable>);
          }
        } else {
          // Again we need a quick if to determine whether tiles should be 
          // wrapped in pressable or not.

          if (!tileCallback) {
            row.push(<Image key={`tile<${i},${j}>`} style={styles.tile(bgColor, tileSize)} source={icon} />);
          } else {
            row.push(<Pressable key={`tile<${i},${j}>`} onPress={pressCallback}
              touchSoundDisabled={true} android_disableSound={true}>
              <Image style={styles.tile(bgColor, tileSize)} source={icon} />
            </Pressable>);
          }
        }
      }
    }

    // Not even the slightest clue why but every other row has a tiny 1px gap vertically if we don't
    // add this scuffed litte negative marginTop... React Native boggles the mind sometimes ¯\_(ツ)_/¯
    tilesBoard.push(<View key={`row<${i}>`} style={{
      flexDirection: 'row',
      margin: 0,
      marginTop: rowCorrect ? rowCorrect : -0.01,
    }}>{row}</View>);
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
    borderColor: theme.MAIN_BLUE,
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
  entity: (fontSize) => ({
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
    fontSize: fontSize
  }),
});