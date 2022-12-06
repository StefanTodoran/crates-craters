import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import React, { useState, useRef, useEffect } from "react";

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';
import Inventory from '../components/Inventory';
import Player from '../components/Player';

import { doGameMove, initializeGameObj } from '../Game';
import { graphics } from '../Theme';
import WinScreen from './WinScreen';
const win = Dimensions.get('window');

export default function PlayLevel({ pageCallback, gameStateCallback, level, game, darkMode }) {
  useEffect(() => {
    // If there is already a game object we wish to resume. We have to wrap
    // this in a useEffect so we don't update the parent state in the middle of a render.
    // We don't just have parent init the gameObj since we want to abstract that away from App.js

    if (game === null) {
      gameStateCallback(initializeGameObj(level));
    } else {
      handleGesture();
      panResponderEnabled.current = !game.won;
    }
  });

  const [touchMove, setTouchMove] = useState({ y: 0, x: 0 });
  const [gesture, setGesture] = useState([false, false, false, false]); // up, down, left, right
  const panResponderEnabled = useRef(true);

  function handleGesture() {
    const [up, down, left, right] = gesture;
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

    setGesture([false, false, false, false]);
    gameStateCallback(new_state);
  }

  function onGestureMove(evt, gestureState) {
    const sensitivity = 0.6; // TODO: Set this in the settings somewhere!!
    let dragY = Math.abs(gestureState.dy) * sensitivity;
    let dragX = Math.abs(gestureState.dx) * sensitivity;

    if (dragX > dragY) {
      dragY /= Math.max(2, dragX - dragY);
    } else {
      dragX /= Math.max(2, dragY - dragX);
    }

    setTouchMove({ y: Math.sign(gestureState.dy) * dragY, x: Math.sign(gestureState.dx) * dragX });
  }

  function onEndGesture(evt, gestureState) {
    const distance = win.width / 10;
    const vertDist = gestureState.dy; const horizDist = gestureState.dx;

    let up = (vertDist < distance);
    let down = (vertDist > -distance);
    let left = (horizDist < distance);
    let right = (horizDist > -distance);

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

    // By updating state, the component will be rerendered and
    // the useEffect at the top will happen, calling handleGesture.
    setTouchMove({ y: 0, x: 0 });
    setGesture([up, down, left, right]);
  }

  const panResponder = React.useRef(
    PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => panResponderEnabled.current,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => panResponderEnabled.current,
      onMoveShouldSetPanResponder: (evt, gestureState) => panResponderEnabled.current,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => panResponderEnabled.current,
      onPanResponderTerminationRequest: (evt, gestureState) => panResponderEnabled.current,
      onShouldBlockNativeResponder: (evt, gestureState) => panResponderEnabled.current,

      onPanResponderGrant: (evt, gestureState) => { // The gesture has started!
        setTouchMove({ y: 0, x: 0 });
      },
      onPanResponderMove: onGestureMove,
      onPanResponderRelease: onEndGesture,
      onPanResponderTerminate: onEndGesture,
    })
  ).current;

  return (
    <>
      {game && <View style={styles.container}>
        <View {...panResponder.panHandlers}>
          <GameBoard board={game.board}>
            <Player game={game} touch={touchMove} darkMode={darkMode} />
          </GameBoard>
          <Inventory coins={game.coins} maxCoins={game.maxCoins} keys={game.keys} />
          {game.won && <WinScreen darkMode={darkMode} />}
        </View>
        <View style={styles.buttonsRow}>
          {!game.won && <MenuButton onPress={gameStateCallback} value={initializeGameObj(level)} label="Restart" icon={graphics.HELP_ICON} width={win.width / 3} />}
          <MenuButton onPress={pageCallback} value="level_select" label="Levels" icon={graphics.FLAG} width={win.width / 3} />
          {game.won && <MenuButton onPress={pageCallback} value="home" label="Menu" icon={graphics.DOOR} width={win.width / 3} />}
        </View>
      </View>}
    </>
  );
}

// Boolean to integer, returns 0 or 1 for false or true respectively.
function bti(bool) {
  return bool === true ? 1 : 0;
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
});