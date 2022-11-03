import { View, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import React, { useRef, useEffect } from "react";

import { tiles, tileAt, icon_src } from '../Game';
import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

export default function GameBoard({ board, player, prev, keys, touch, darkMode }) {
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
        const borderColor = oddTile ? colors.MEDIUM_WALL : colors.DARK_WALL;
        const fillColor = oddTile ? colors.LIGHT_WALL : colors.MEDIUM_WALL;

        row.push(<View key={`tile<${i},${j}>`} style={styles.wallTile(fillColor, borderColor, tileSize)} />);
      } else {
        // Regular tiles are sized like wall tiles but are Image elements. All
        // tiles have png sources so the checkered background colors can show through.
        const icon = icon_src(tileType);
        const bgColor = oddTile ? colors.LIGHT_TILE : colors.DARK_TILE;

        row.push(<Image key={`tile<${i},${j}>`} style={styles.tile(bgColor, tileSize)} source={icon} />);
      }
    }
    tilesBoard.push(<View key={`row<${i}>`} style={{ flexDirection: 'row', margin: 0 }}>{row}</View>);
  }

  const optionsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
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
    ).start();
  }, []);

  // We only add selectors on adjacent tiles where the player could actually move.
  const options = [];
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      if ((y === 0 || x === 0) && !(y === 0 && x === 0)) {
        const xPos = player.x + x;
        const yPos = player.y + y;

        const tile = tileAt(yPos, xPos, board);
        let selectable = !(["outside", "crater", "wall"].includes(tile));
        selectable = (tile === "door" && keys === 0) ? false : selectable;

        if (selectable) {
          const optionStyle = styles.optionTile(xPos, yPos, tileSize, optionsAnim);
          options.push(<Animated.View key={`option<${x},${y}}`} style={optionStyle}></Animated.View>)
        }
      }
    }
  }

  const still = (touch.x === 0 && touch.y === 0);
  const player_src = (still) ? graphics.PLAYER : (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;

  return (
    <View style={styles.board(colors)}>
      {tilesBoard}
      {options}
      <Animated.View style={{
        ...styles.player(player.x, player.y, tileSize, touch.x, touch.y),
      }}>
        <Image style={styles.tile("#00000000", tileSize)} source={player_src} />
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
  player: (xPos, yPos, tileSize, touchX, touchY) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      {
        translateY: Math.abs(touchY) > tileSize ? Math.sign(touchY) * tileSize : touchY
      },
      {
        translateX: Math.abs(touchX) > tileSize ? Math.sign(touchX) * tileSize : touchX
      },
    ],
  }),
  optionTile: (xPos, yPos, size, scaleAnim) => ({
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    opacity: 0.4,

    borderColor: colors.DARK_COLOR,
    borderStyle: "solid",
    borderWidth: 1,

    transform: [{
      scale: scaleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.85, 0.95],
      })
    }],
  }),
});