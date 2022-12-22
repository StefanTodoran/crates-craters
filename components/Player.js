import { StyleSheet, Dimensions, Image, Animated } from 'react-native';
import React, { useRef, useEffect } from "react";

import { tileAt } from '../Game';
import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

export default function Player({ game, touch, darkMode }) {
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

  const tileSize = calcTileSize(game.board[0].length, game.board.length);

  // We only add selectors on adjacent tiles where the player could actually move.
  const options = [];
  for (let x = -1; x < 2; x++) {
    for (let y = -1; y < 2; y++) {
      if ((y === 0 || x === 0) && !(y === 0 && x === 0)) {
        const xPos = game.player.x + x;
        const yPos = game.player.y + y;

        const tile = tileAt(yPos, xPos, game.board);
        let selectable = !(["outside", "crater", "wall"].includes(tile));
        selectable = (tile === "door" && game.keys === 0) ? false : selectable;
        selectable = (tile === "flag" && game.coins !== game.maxCoins) ? false : selectable;

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
    <>
      {options}
      <Animated.View style={{
        ...styles.player(game.player.x, game.player.y, tileSize, touch.x, touch.y),
      }}>
        <Image style={styles.tile("#00000000", tileSize)} source={player_src} />
      </Animated.View>
    </>
  );
}

// Same function as in GameBoard.js, if you change it here,
// change it there too!
function calcTileSize(boardWidth, boardHeight) {
  const maxWidth = (win.width * 0.9) / boardWidth;
  const maxHeight = (win.height * 0.8) / boardHeight;
  return Math.min(maxWidth, maxHeight);
}

const styles = StyleSheet.create({
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