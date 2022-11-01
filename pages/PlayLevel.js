import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import React, { useState, useRef, useEffect } from "react";

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';
import Inventory from './Inventory';

import { doGameMove, initializeGameObj } from '../Game';
import Graphics from '../Graphics';
import WinScreen from './WinScreen';
const win = Dimensions.get('window');

export default function PlayLevel({ pageCallback, gameStateCallback, level, game, darkMode }) {
  useEffect(() => {
    // If there is already a game object we wish to resume. We have to wrap
    // this in a useEffect so we don't update the parent state in the middle of a render.
    // We don't just have parent init the gameObj since we want to abstract that away from App.js
    if (game === null) {
      gameStateCallback(initializeGameObj(level));
    }
  });
  const touchPos = useRef({ y: null, x: null });
  const [prevPos, setPrevPos] = useState({ y: null, x: null });

  const handleGesture = (up, down, left, right) => {
    // Exactly one of up, down, left, right must be true!
    if (bti(up) + bti(down) + bti(left) + bti(right) !== 1) {
      return;
    }

    let new_state;
    if (up) {
      new_state = doGameMove(game, "up");
    } else if (down) {
      new_state = doGameMove(game, "down");
    } else if (left) {
      new_state = doGameMove(game, "left");
    } else if (right) {
      new_state = doGameMove(game, "right");
    }
    setPrevPos({ y: game.player.y, x: game.player.x });
    gameStateCallback(new_state);
  }

  function handleMotion(e) {
    const distance = 35; // TODO: probably set this based on screen size later
    const vertDist = touchPos.current.y - e.nativeEvent.pageY;
    const horizDist = touchPos.current.x - e.nativeEvent.pageX;

    let up = (vertDist > distance);
    let down = (vertDist < -distance);
    let left = (horizDist > distance);
    let right = (horizDist < -distance);

    // If they swiped perfectly vertically or horizontally, we can just
    // go ahead and skip this and call handleGesture.
    if (bti(up) + bti(down) + bti(left) + bti(right) !== 1) {
      const diff = Math.abs(vertDist) - Math.abs(horizDist);
      // Otherwise, we want to calculate if it was more of a vertical
      // swipe or a horizontal swipe and send that data to handleGesture.
      if (diff > 0) {
        left = false; right = false;
      } else {
        up = false; down = false;
      }
    }
    handleGesture(up, down, left, right);
  }

  return (
    <Pressable style={styles.container}
      onPressIn={e => {
        touchPos.current.y = e.nativeEvent.pageY;
        touchPos.current.x = e.nativeEvent.pageX;
      }}
      onLongPress={handleMotion} onPressOut={handleMotion}>
      {game && <View>
        <GameBoard board={game.board} player={game.player} prev={prevPos} />
        <Inventory coins={game.coins} maxCoins={game.maxCoins} keys={game.keys} />
        {game.won && <WinScreen darkMode={darkMode} />}
      </View>}
      <View style={styles.buttonsRow}>
        <MenuButton onPress={pageCallback} value="level_select" label="Levels" icon={Graphics.FLAG} width={win.width / 3} />
        <MenuButton onPress={pageCallback} value="home" label="Menu" icon={Graphics.DOOR} width={win.width / 3} />
      </View>
    </Pressable>
  );
}

// Boolean to integer, returns 0 or 1 for false or true respectively.
function bti(bool) {
  return bool === true ? 1 : 0;
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    paddingTop: win.height * 0.05,
    alignItems: "center",
  },
  buttonsRow: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  winModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: sizeFromWidthPercent(0.8, 145, 600)[0],
    height: sizeFromWidthPercent(0.8, 145, 600)[1],
  },
});