import { View, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import React, { useRef, useEffect } from "react";

import { tiles, icon_src } from '../Game';
import player_icon from '../assets/player.png';
import Colors from '../Colors';
const win = Dimensions.get('window');

export default function GameBoard({ board, player, prev }) {
  const tilesBoard = [];
  const boardHeight = board.length; const boardWidth = board[0].length;
  const tileSize = calcTileSize(boardWidth, boardHeight);

  for (let i = 0; i < boardHeight; i++) {
    const row = [];
    for (let j = 0; j < boardWidth; j++) {
      // We need to know oddTile (board is checkered color-wise) and the tile type
      // regardless of whether the tile will be a wall or regular tile.
      const oddTile = (isEven(i) && isEven(j)) || (!isEven(i) && !isEven(j));
      const tileType = tiles[board[i][j]];

      if (tileType === "wall") {
        // Wall tiles are just Views with border and background.
        const borderColor = oddTile ? Colors.MEDIUM_WALL : Colors.DARK_WALL;
        const fillColor = oddTile ? Colors.LIGHT_WALL : Colors.MEDIUM_WALL;

        row.push(<View key={`tile<${i},${j}>`} style={styles.wallTile(fillColor, borderColor, tileSize)} />);
      } else {
        // Regular tiles are sized like wall tiles but are Image elements. All
        // tiles have png sources so the checkered background colors can show through.
        const icon = icon_src[tileType];
        const bgColor = oddTile ? Colors.LIGHT_TILE : Colors.DARK_TILE;

        row.push(<Image key={`tile<${i},${j}>`} style={styles.tile(bgColor, tileSize)} source={icon} />);
      }
    }
    tilesBoard.push(<View key={`row<${i}>`} style={{ flexDirection: 'row', margin: 0 }}>{row}</View>);
  }

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  });

  // These values are multiplied by a transform in the style. If the position didn't 
  // change in that direction, we assign zero so that the transform in that direction 
  // doesn't do anything. Otherwise, we set it based on whether the previous value was 
  // lower or higher to animate in the corrent direction.
  const animX = (player.x !== prev.x) ? (player.x > prev.x) ? -1 : 1 : 0;
  const animY = (player.y !== prev.y) ? (player.y > prev.y) ? -1 : 1 : 0;

  console.log(player, prev);

  return (
    <View style={styles.board}>
      {tilesBoard}
      <Animated.View style={{
        ...styles.player(player.x, player.y, tileSize, anim, animX, animY),
      }}>
        <Image style={styles.tile("#00000000", tileSize)} source={player_icon} />
      </Animated.View>
    </View>
  );
}

function isEven(num) { return num % 2 === 0; }

function calcTileSize(boardWidth, boardHeight) {
  const maxWidth = (win.width * 0.9) / boardWidth;
  const maxHeight = (win.height * 0.8) / boardHeight;
  return Math.min(maxWidth, maxHeight);
}

const styles = StyleSheet.create({
  board: {
    position: "relative",
    borderWidth: 1,
    borderColor: Colors.MAIN_BLUE,
    borderRadius: 5,
    overflow: "hidden",
  },
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
  player: (xPos, yPos, tileSize, anim, animX, animY) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [tileSize * animY, 0],
      }),
      translateX: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [tileSize * animX, 0],
      }),
    }],
  }),
});