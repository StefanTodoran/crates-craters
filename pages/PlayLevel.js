import { View, StyleSheet, Dimensions, PanResponder, Animated, SafeAreaView, StatusBar } from 'react-native';
import React, { useState, useRef, useEffect, useContext, useMemo } from 'react';

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';
import Inventory from '../components/Inventory';
import Player from '../components/Player';

import { doGameMove, initializeGameObj, calcTileSize, canMoveTo, levels } from '../Game';
import { colors, graphics } from '../Theme';
import WinScreen from './WinScreen';
const win = Dimensions.get('window');

import { Audio } from 'expo-av';
import { GlobalContext } from '../GlobalContext';
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * This component handles a wide variety of tasks related to level playing. It
 * controls the PanResponder that handles input gestures, including both swipe
 * movement gestures and long press gestures. It relays such data to the GameBoard,
 * Player, and Inventory components. This component also contains the navigation
 * buttons for this page.
 * 
 * The level to be played and current game state are passed to this component from
 * the parent. If the game state is empty, a new game is initialized based on the
 * provided level number. If there is already a game state, play is resumed from
 * that state.
 * 
 * Game sounds are also handled in this component.
 * 
 * @param {Function} pageCallback
 * Takes a string and sets the page state in the parent.
 * 
 * @param {Function} levelCallback
 * Takes an integer and updates the parent's level state as well as clearing current game state.
 * 
 * @param {Function} gameStateCallback
 * Takes a game object, stores it in the parent for resumeability. Should have this format:
 * {
 *   board: number[][],
 *   player: {x: number, y: number},
 *   maxCoins: number,
 *   coins: number,
 *   keys: number,
 *   won: boolean,
 * }
 * 
 * @param {number} level
 * Which level number to load the level data from (since on first mount the component
 * does not recieve anything in its game prop, see below) 
 * 
 * @param {Object} game
 * Object of the form descirbed above in gameStateCallback, representing the state of the
 * game the player is currently playing.
 * 
 * @param {boolean} test
 * Whether or not the play screen has been opened from the level creation menu. If it has, this
 * is a playtest run and the navigation buttons should show return to level creation, not levels.
 */
export default function PlayLevel({ pageCallback, levelCallback, gameStateCallback, level, game, test }) {
  const { darkMode, dragSensitivity, doubleTapDelay } = useContext(GlobalContext);

  useEffect(() => {
    // If there is already a game object we wish to resume. We have to wrap
    // this in a useEffect so we don't update the parent state in the middle of a render.
    // We don't just have parent init the gameObj since we want to abstract that away from App.js

    if (game === null) {
      gameStateCallback(initializeGameObj(level, test));
    } else {
      handleGesture();
      panResponderEnabled.current = !game.won;
    }
  });

  // Set up for sounds, most of this is just copied from the very
  // limited expo-av documentation so don't mess with it.
  const [moveSound, setMoveSound] = useState();
  const [errorSound, setErrorSound] = useState();
  const [coinSound, setCoinSound] = useState();
  const [doorSound, setDoorSound] = useState();

  async function playMoveSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/move.wav'));
    setMoveSound(sound);
    await sound.playAsync();
  }
  async function playErrorSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/badmove.wav'));
    setErrorSound(sound);
    await sound.playAsync();
  }
  async function playCoinSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/coin.wav'));
    setCoinSound(sound);
    await sound.playAsync();
  }
  async function playDoorSound() {
    const doorSources = [require('../assets/audio/door_1.wav'), require('../assets/audio/door_2.wav'), require('../assets/audio/door_3.wav')];
    const { sound } = await Audio.Sound.createAsync(doorSources[getRandomInt(0, doorSources.length)]);
    setDoorSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return moveSound ? () => { moveSound.unloadAsync(); } : undefined;
  }, [moveSound]);
  useEffect(() => {
    return errorSound ? () => { errorSound.unloadAsync(); } : undefined;
  }, [errorSound]);
  useEffect(() => {
    return coinSound ? () => { coinSound.unloadAsync(); } : undefined;
  }, [coinSound]);
  useEffect(() => {
    return doorSound ? () => { doorSound.unloadAsync(); } : undefined;
  }, [doorSound]);

  // Player input related state. The touchMove state is used for the <Player/> component 
  // preview of moves, gesture is used for actually completing those moves on release.
  const [touchMove, setTouchMove] = useState({ y: 0, x: 0 });
  const [gesture, setGesture] = useState([false, false, false, false]); // up, down, left, right

  // More player input state, we use these to keep track of double taps. We need to know
  // the previous tap time so we can determine if the two taps happened fast enough, and
  // we keep track of position show it is only a double tap if its the same square twice.
  const [prevTouchTime, setPrevTouchTime] = useState(null);
  const [prevTouchPos, setPrevTouchPos] = useState(null);
  const [touchPos, setTouchPos] = useState({ y: -1, x: -1 });
  const pressAnim = useRef(new Animated.Value(0)).current;

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

    // Check if any sounds need to be played
    if (new_state.player.x === game.player.x && new_state.player.y === game.player.y) {
      playErrorSound();
    } else {
      playMoveSound();
      if (new_state.coins > game.coins || new_state.keys > game.keys) {
        playCoinSound();
      } else if (new_state.keys < game.keys) {
        playDoorSound();
      }
    }

    setGesture([false, false, false, false]);
    gameStateCallback(new_state);
  }

  function onGestureMove(evt, gestureState) {
    const sensitivity = dragSensitivity / 100; // dragSens is given as a number representing a percent e.g. 60
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

    let up = (vertDist < -distance);
    let down = (vertDist > distance);
    let left = (horizDist < -distance);
    let right = (horizDist > distance);

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

    // We don't want fast succesive swipe gestures to trigger the
    // double tap jump to position input.
    if (up || down || left || right) {
      setPrevTouchPos(null);
    }

    // By updating state, the component will be rerendered and
    // the useEffect at the top will happen, calling handleGesture.
    setTouchMove({ y: 0, x: 0 });
    setGesture([up, down, left, right]);
  }

  const tileSize = game ? calcTileSize(game.board[0].length, game.board.length, win) : 1;
  const panResponder = useMemo(
    () => PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => panResponderEnabled.current,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => panResponderEnabled.current,
      onMoveShouldSetPanResponder: (evt, gestureState) => panResponderEnabled.current,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => panResponderEnabled.current,
      onPanResponderTerminationRequest: (evt, gestureState) => panResponderEnabled.current,
      onShouldBlockNativeResponder: (evt, gestureState) => panResponderEnabled.current,

      onPanResponderGrant: function (evt, gestureState) { // The gesture has started!
        setTouchMove({ y: 0, x: 0 });

        const pressX = pressToIndex(gestureState.x0, tileSize);
        const pressY = pressToIndex(gestureState.y0, tileSize) - 1;

        if (Date.now() - prevTouchTime < doubleTapDelay && prevTouchPos &&
          prevTouchPos.x === pressX && prevTouchPos.y === pressY) {

          setTouchPos({ x: pressX, y: pressY });
          setPrevTouchPos(null);

          Animated.timing(pressAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
          setTimeout(() => {
            Animated.timing(pressAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();

            const path = canMoveTo(game, pressX, pressY);
            if (path) {
              let current = game;
              for (let i = 0; i < path.length; i++) {
                current = doGameMove(current, path[i]);
              }
              gameStateCallback(current);
            }
          }, 750);
        }
        setPrevTouchPos({
          y: pressToIndex(gestureState.y0, tileSize) - 1,
          x: pressToIndex(gestureState.x0, tileSize)
        });
        const touchTime = Date.now();
        setPrevTouchTime(touchTime);
      },
      onPanResponderMove: onGestureMove,
      onPanResponderRelease: onEndGesture,
      onPanResponderTerminate: onEndGesture,
    }),
    [prevTouchPos, tileSize, prevTouchTime]
  );

  return (
    <>
      {game && <SafeAreaView style={styles.container}>
        <View {...panResponder.panHandlers}>
          <GameBoard board={game.board} tileSize={tileSize}>
            <Player game={game} touch={touchMove} darkMode={darkMode} tileSize={tileSize} />
            {touchPos && <Animated.View style={styles.indicator(touchPos.x, touchPos.y, tileSize, pressAnim)} />}
          </GameBoard>
          <Inventory coins={game.coins} maxCoins={game.maxCoins} keys={game.keys} />
          {game.won && <WinScreen darkMode={darkMode} />}
        </View>
        <View style={styles.buttonsRow}>
          {!game.won && <>
            
            <MenuButton onPress={gameStateCallback} value={initializeGameObj(level, test)} label="Restart" icon={graphics.HELP_ICON} width={win.width / 3} />
            {!game.playtest && <MenuButton onPress={pageCallback} value="level_select" label="Levels" icon={graphics.FLAG} width={win.width / 3} />}
            {game.playtest && <MenuButton onPress={() => { pageCallback("level_editor", true) }} label="Editor" icon={graphics.OPTIONS_ICON} width={win.width / 3} />}
          </>}
          {game.won && <>
            {!game.playtest && <MenuButton onPress={levelCallback} value={level + 1} label="Next" icon={graphics.FLAG} width={win.width / 3} disabled={level + 1 >= levels.length} />}
            <MenuButton onPress={pageCallback} value="level_select" label="Go Back" icon={graphics.DOOR} width={win.width / 3} />
            {game.playtest && <MenuButton onPress={() => { pageCallback("level_editor", true) }} label="Editor" icon={graphics.OPTIONS_ICON} width={win.width / 3} />}
          </>}
        </View>
      </SafeAreaView>}
    </>
  );
}

// Boolean to integer, returns 0 or 1 for false or true respectively.
function bti(bool) {
  return bool === true ? 1 : 0;
}

function pressToIndex(touchPos, tileSize) {
  const correction = -10;
  return Math.floor((touchPos + correction) / tileSize);
}

function deviates(numA, numB, tolerance) {
  return Math.abs(numA - numB) > tolerance;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    paddingTop: StatusBar.currentHeight + 15,
    paddingBottom: win.height * 0.05,
    alignItems: "center",
    justifyContent: "space-around",
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: win.width * 0.45,
  },
  indicator: (xPos, yPos, size, anim) => ({
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    backgroundColor: colors.MAIN_COLOR_TRANSPARENT,
    borderColor: colors.DARK_COLOR,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
    opacity: anim,
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 0.925, 1],
        outputRange: [0.9, 1.65, 1.45],
      }),
    }],
  }),
});