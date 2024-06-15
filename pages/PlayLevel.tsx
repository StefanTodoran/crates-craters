import { View, StyleSheet, Dimensions, PanResponder, Animated, SafeAreaView, Text, GestureResponderEvent, PanResponderGestureState } from "react-native";
import { useState, useRef, useEffect, useContext, useMemo } from "react";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { Sound } from "expo-av/build/Audio";
import { Audio } from "expo-av";

import SimpleButton from "../components/SimpleButton";
import MoveCounter from "../components/MoveCounter";
import MenuButton from "../components/MenuButton";
import GameBoard from "../components/GameBoard";
import Inventory from "../components/Inventory";
import Player from "../components/Player";
import WinScreen from "./WinScreen";

// import { aStarSearch, basicHeuristic, compoundHeuristic } from "../util/search";
import { Game, SoundEvent, canMoveTo, doGameMove, initializeGameObj } from "../util/logic";
import { Direction, Level, PageView } from "../util/types";
import { markLevelCompleted } from "../util/loader";
import { calcBoardTileSize } from "../util/board";
import { colors, graphics } from "../Theme";
import BackButton from "../assets/BackButton";

const win = Dimensions.get("window");

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  nextLevelCallback: (uuid: string) => void, // Request the parent update the level to the next level. 
  gameStateCallback: (newState: Game) => void, // Updates the state of the game, stored in the parent for resumeability.
  gameHistoryCallback: (newHistory: Game[]) => void, // Updates the history of the state of the game, stored in the parent for resumeability.

  level: Level, // The level currently being played. 
  game: Game, // The current game state.
  history: Game[],
  playtest: boolean, // Whether or not the play screen has been opened from the level creation menu. If so the navigation buttons should show return to level creation, not levels.
}

interface Position {
  x: number,
  y: number,
}

type Gesture = [boolean, boolean, boolean, boolean]; // up, down, left, right

/**
 * This component handles a wide variety of tasks related to level playing. It
 * controls the PanResponder that handles input gestures, including both swipe
 * movement gestures and long press gestures. It relays such data to the GameBoard,
 * Player, and Inventory components.
 * 
 * The level to be played and current game state are passed to this component from
 * the parent. If the game state is empty, a new game is initialized based on the
 * provided level number. If there is already a game state, play is resumed from
 * that state.
 * 
 * Game sounds are also handled in this component.
 */
export default function PlayLevel({
  viewCallback,
  nextLevelCallback,
  gameStateCallback,
  gameHistoryCallback,
  level,
  game,
  history,
  playtest,
}: Props) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

  function updateGameState(newState: Game) {
    gameStateCallback(newState);
    gameHistoryCallback([...history, game]);
  }

  // Set up for sounds, most of this is just copied from the very
  // limited expo-av documentation so don't mess with it.
  const [moveSound, setMoveSound] = useState<Sound>();
  const [pushSound, setPushSound] = useState<Sound>();
  const [fillSound, setFillSound] = useState<Sound>();
  const [coinSound, setCoinSound] = useState<Sound>();
  const [doorSound, setDoorSound] = useState<Sound>();
  const [boomSound, setBoomSound] = useState<Sound>();

  async function playMoveSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/move.wav"));
    setMoveSound(sound);
    await sound.playAsync();
  }
  async function playPushSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/push.wav"));
    setPushSound(sound);
    await sound.playAsync();
  }
  async function playFillSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/fill.wav"));
    setFillSound(sound);
    await sound.playAsync();
  }
  async function playCoinSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/coin.wav"));
    setCoinSound(sound);
    await sound.playAsync();
  }
  async function playDoorSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/door.wav"));
    setDoorSound(sound);
    await sound.playAsync();
  }
  async function playExplosionSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/explosion.wav"));
    setBoomSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return moveSound ? () => { moveSound.unloadAsync(); } : undefined;
  }, [moveSound]);
  useEffect(() => {
    return pushSound ? () => { pushSound.unloadAsync(); } : undefined;
  }, [pushSound]);
  useEffect(() => {
    return fillSound ? () => { fillSound.unloadAsync(); } : undefined;
  }, [fillSound]);
  useEffect(() => {
    return coinSound ? () => { coinSound.unloadAsync(); } : undefined;
  }, [coinSound]);
  useEffect(() => {
    return doorSound ? () => { doorSound.unloadAsync(); } : undefined;
  }, [doorSound]);
  useEffect(() => {
    return boomSound ? () => { boomSound.unloadAsync(); } : undefined;
  }, [boomSound]);

  function playSoundEffect(soundEffect: SoundEvent | undefined) {
    if (!playAudio) return;

    switch (soundEffect) {
      case SoundEvent.EXPLOSION:
        playExplosionSound();
        break;
      case SoundEvent.PUSH:
        playPushSound();
        break;
      case SoundEvent.FILL:
        playFillSound();
        break;
      case SoundEvent.DOOR:
        playDoorSound();
        break;
      case SoundEvent.COLLECT:
        playCoinSound();
        break;
      case SoundEvent.MOVE:
        playMoveSound();
        break;
    }
  }

  // Player input related state. The touchMove state is used for the <Player/> component 
  // preview of moves, gesture is used for actually completing those moves on release.
  const [touchMove, setTouchMove] = useState({ y: 0, x: 0 });
  const panResponderEnabled = useRef(true);

  useEffect(() => {
    panResponderEnabled.current = !game.won;
    if (game.won) markLevelCompleted(game.uuid, history.length);
  }, [game]);

  // More player input state, we use these to keep track of double taps. We need to know
  // the previous tap time so we can determine if the two taps happened fast enough, and
  // we keep track of position show it is only a double tap if its the same square twice.
  const prevTouchTime = useRef(Date.now());
  const prevTouchPos = useRef<Position>();
  const [touchPos, setTouchPos] = useState({ y: -1, x: -1 });
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handleGesture = useRef((_gesture: Gesture) => { });
  useEffect(() => {
    handleGesture.current = (gesture: Gesture) => {
      const [up, down, left, right] = gesture;
      // Exactly one of up, down, left, right must be true!
      if (bti(up) + bti(down) + bti(left) + bti(right) !== 1) {
        return;
      }

      let newState, stateChanged;
      if (up) {
        [newState, stateChanged] = doGameMove(game, Direction.UP);
      } else if (down) {
        [newState, stateChanged] = doGameMove(game, Direction.DOWN);
      } else if (left) {
        [newState, stateChanged] = doGameMove(game, Direction.LEFT);
      } else { // if (right) {
        [newState, stateChanged] = doGameMove(game, Direction.RIGHT);
      }

      playSoundEffect(newState.soundEvent);
      if (stateChanged) updateGameState(newState);
    }
  }, [game]);

  const tileSize = calcBoardTileSize(game.board.width, game.board.height, win);
  const xCorrect = -0.5 * tileSize;
  const yCorrect = -1.5 * tileSize;

  const onGestureStart = useRef((_evt: GestureResponderEvent, _gestureState: PanResponderGestureState) => { });
  useEffect(() => {
    onGestureStart.current = (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      setTouchMove({ y: 0, x: 0 });

      const pressX = pressToIndex(gestureState.x0, tileSize, xCorrect);
      const pressY = pressToIndex(gestureState.y0, tileSize, yCorrect);

      if (
        Date.now() - prevTouchTime.current < doubleTapDelay &&
        prevTouchPos.current &&
        prevTouchPos.current.x === pressX &&
        prevTouchPos.current.y === pressY
      ) {
        setTouchPos({ x: pressX, y: pressY });
        prevTouchPos.current = undefined;

        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          const path = canMoveTo(game, pressX, pressY);
          if (path) {
            let current = game;
            for (let i = 0; i < path.length; i++) {
              [current] = doGameMove(current, path[i]);
            }

            updateGameState(current);
            playSoundEffect(current.soundEvent);
          }

          Animated.timing(pressAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        });
      } else {
        prevTouchPos.current = {
          x: pressToIndex(gestureState.x0, tileSize, xCorrect),
          y: pressToIndex(gestureState.y0, tileSize, yCorrect),
        };
        const touchTime = Date.now();
        prevTouchTime.current = touchTime;
      }
    };
  }, [game]);

  const panResponder = useMemo(() => {
    const sensitivity = dragSensitivity / 100; // dragSens is given as a number representing a percent e.g. 60
    function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      let dragY = Math.abs(gestureState.dy) * sensitivity;
      let dragX = Math.abs(gestureState.dx) * sensitivity;

      if (dragX > dragY) {
        dragY /= Math.max(2, dragX - dragY);
      } else {
        dragX /= Math.max(2, dragY - dragX);
      }

      setTouchMove({ y: Math.sign(gestureState.dy) * dragY, x: Math.sign(gestureState.dx) * dragX });
    }

    function onGestureEnd(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
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
        prevTouchPos.current = undefined;
      }

      handleGesture.current([up, down, left, right]);
      setTouchMove({ y: 0, x: 0 });
    }

    return PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => panResponderEnabled.current,
      onStartShouldSetPanResponderCapture: () => panResponderEnabled.current,
      onMoveShouldSetPanResponder: () => panResponderEnabled.current,
      onMoveShouldSetPanResponderCapture: () => panResponderEnabled.current,
      onPanResponderTerminationRequest: () => panResponderEnabled.current,
      onShouldBlockNativeResponder: () => panResponderEnabled.current,

      onPanResponderGrant: (...args) => onGestureStart.current(...args),
      onPanResponderMove: onGestureMove, // These don't need the weird useRef function pattern because they only rely on useState setters, which never change.
      onPanResponderRelease: onGestureEnd,
      onPanResponderTerminate: onGestureEnd,
    })
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
      toValue: animState,
      duration: 350,
      useNativeDriver: true
    }).start(callback);
  }

  function restartLevel() {
    gameStateCallback(initializeGameObj(level));
    gameHistoryCallback([]);
    toggleModal();
  }

  function undoMove() {
    const newHistory = [...history];
    const prevState = newHistory.pop() as Game;

    gameStateCallback(prevState);
    gameHistoryCallback(newHistory);
  }

  function toggleModal() {
    if (modalOpen) {
      setAnimTo(0, () => { setModalOpen(false) });
    } else {
      setModalOpen(true);
      setAnimTo(1);
    }
  }

  return (
    <SafeAreaView style={staticStyles.container}>
      {/* GAMEPLAY COMPONENTS */}
      <View>
        <MoveCounter moveCount={game.moveCount} />

        <View style={staticStyles.centerContents} {...panResponder.panHandlers}>
          <GameBoard board={game.board} overrideTileSize={tileSize}>
            <Player game={game} touch={touchMove} darkMode={darkMode} tileSize={tileSize} />

            {touchPos && <Animated.View style={[
              staticStyles.indicator,
              dynamicStyles.indicator(touchPos.x, touchPos.y, tileSize, pressAnim, darkMode),
            ]} />}
          </GameBoard>
        </View>

        <Inventory coins={game.coins} maxCoins={game.maxCoins} keys={game.keys} />
        {game.won && <WinScreen />}
      </View>

      {/* PAUSE MENU COMPONENTS */}
      {modalOpen && <Animated.View style={[
        staticStyles.modal,
        dynamicStyles.modal(anim, darkMode),
      ]}>
        <Text style={dynamicStyles.subtitle(darkMode)}>Menu</Text>
        <MenuButton
          label="Restart Level"
          icon={graphics.BOMB}
          theme={colors.RED_THEME}
          onPress={restartLevel}
          fillWidth
        />
        <MenuButton
          label="Undo Move"
          icon={graphics.ONE_WAY_LEFT}
          theme={colors.BLUE_THEME}
          onPress={undoMove}
          disabled={history.length === 0}
          fillWidth
        />
        {playtest ?
          <MenuButton
            label={"Keep Editing"}
            icon={graphics.HAMMER_ICON}
            onPress={() => viewCallback(PageView.EDITOR)}
            fillWidth
          />
          :
          <MenuButton
            label={"Level Select"}
            icon={graphics.DOOR_ICON}
            onPress={() => viewCallback(PageView.LEVELS)}
            fillWidth
          />
        }
        <MenuButton
          label="Resume Game"
          icon={graphics.KEY}
          theme={colors.GREEN_THEME}
          onPress={toggleModal}
          fillWidth
        />
        {/* <MenuButton
          label="Get Hint"
          icon={graphics.SUPPORT_ICON}
          theme={colors.GREEN_THEME}
          onPress={() => {
            aStarSearch(game, compoundHeuristic);
            aStarSearch(game, basicHeuristic);
          }}
        /> */}
      </Animated.View>}

      <Animated.View style={dynamicStyles.buttonsRow(anim)}>
        <SimpleButton onPress={() => viewCallback(playtest ? PageView.MANAGE : PageView.LEVELS)} Svg={BackButton} square />
        <View style={staticStyles.buttonGap} />

        {!game.won && <SimpleButton onPress={toggleModal} icon={graphics.MENU_ICON} text="Menu" main />}
        {game.won && <>
          {playtest && <SimpleButton onPress={() => viewCallback(PageView.EDITOR)} text="Keep Editing" main={true} />}
          {!playtest && <SimpleButton onPress={() => nextLevelCallback(level.uuid)} icon={graphics.PLAY_ICON} text="Next Level" main={true} />}
        </>}
      </Animated.View>
    </SafeAreaView>
  );
}

// Boolean to integer, returns 0 or 1 for false or true respectively.
function bti(bool: boolean) {
  return bool === true ? 1 : 0;
}

function pressToIndex(touchPos: number, tileSize: number, correction: number) {
  return Math.floor((touchPos + correction) / tileSize);
}

const dynamicStyles = StyleSheet.create<any>({
  subtitle: (darkMode: boolean) => ({
    ...TextStyles.subtitle(darkMode),
    marginBottom: -normalize(5),
  }),
  buttonsRow: (anim: Animated.Value) => ({
    flexDirection: "row",
    marginTop: normalize(10),
    // height: normalize(50),
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  }),
  // TODO: factor this out maybe? also found in EditLevel and WinScreen
  modal: (anim: Animated.Value, darkMode: boolean) => ({
    backgroundColor: darkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
    opacity: anim,
  }),
  indicator: (xPos: number, yPos: number, size: number, anim: Animated.Value, darkMode: boolean) => ({
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    backgroundColor: (darkMode) ? colors.OFF_WHITE_TRANSPARENT(0.2) : colors.NEAR_BLACK_TRANSPARENT(0.1),
    borderColor: (darkMode) ? colors.OFF_WHITE : colors.DIM_GRAY,
    opacity: anim,
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 0.925, 1],
        outputRange: [0.9, 1.65, 1.45],
      }),
    }],
  }),
});

const staticStyles = StyleSheet.create({
  container: {
    // Line height is roughly 1.5, found by trial and error,
    // 16 comes from the font size of MoveCounter.
    // marginTop: -(normalize(16) * 1.5),
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  centerContents: {
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonGap: {
    width: normalize(15),
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: win.width * 0.225,
  },
  indicator: {
    position: "absolute",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
  },
});