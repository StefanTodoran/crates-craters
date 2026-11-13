import { Dispatch, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextStyle, View, useWindowDimensions } from "react-native";
import Toast from "../util/toast";
import BackButton from "../assets/BackButton";
import GameBoard from "../components/GameBoard";
import Inventory from "../components/Inventory";
import NativeMenu, { NativeMenuItem } from "../components/NativeMenu";
import MoveCounter from "../components/MoveCounter";
import Player from "../components/Player";
import SimpleButton from "../components/SimpleButton";
import TutorialHint from "../components/TutorialHint";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { calcBoardTileSize } from "../util/board";
import { likeUserLevel, markUserLevelCompleted, postSolutionData } from "../util/database";
import { useSoundEventPlayers } from "../util/hooks";
import { getData, markLevelCompleted, metadataKeys } from "../util/loader";
import { Game } from "../util/logic";
import { PlayAction } from "../util/playSession";
import { OfficialLevel, PageView, PlayMode, SharedLevel, Level } from "../util/types";
import { hapticForEvent, hapticWin } from "../util/haptics";
import { useGameInput } from "../util/useGameInput";
import WinScreen from "./WinScreen";

interface Props {
  viewCallback: (newView: PageView, newPage?: number) => void, // Sets the current view of the application.
  nextLevelCallback: () => void, // Request the parent load the next level.
  dispatch: Dispatch<PlayAction>, // Updates the play session, stored in the parent for resumeability.

  level: Level, // The level currently being played.
  game: Game, // The current game state.
  canUndo: boolean,
  mode: PlayMode,
}

/**
 * The play page. Input gestures are handled by useGameInput, and moves go to the play
 * session reducer in App (so play can be resumed). Plays the sound of each new state.
 */
export default function PlayLevel({
  viewCallback,
  nextLevelCallback,
  dispatch,
  level,
  game,
  canUndo,
  mode,
}: Props) {
  const { darkMode, userCredential } = useContext(GlobalContext);
  const win = useWindowDimensions();
  const playSoundEvent = useSoundEventPlayers();

  // Play the sound of each new game state (not the one we resumed into).
  const prevGame = useRef(game);
  useEffect(() => {
    if (prevGame.current !== game) {
      playSoundEvent(game.soundEvent);
      if (game.won && !prevGame.current.won) hapticWin();
      else hapticForEvent(game.soundEvent);
    }
    prevGame.current = game;
  }, [game]);

  const [canLikeLevel, setCanLikeLevel] = useState(false);
  useEffect(() => {
    if (!level.hasOwnProperty("shared") || !userCredential) return;

    const likedLevels = getData(metadataKeys.likedLevels) || [];
    setCanLikeLevel(!likedLevels.includes(level.uuid) && (level as SharedLevel).user_uid !== userCredential.user.uid);
  }, []);

  useEffect(() => {
    if (!game.won) return;
    if (mode === PlayMode.SHARED) {
      markUserLevelCompleted((level as SharedLevel), userCredential?.user.uid, game.moveHistory);
    } else {
      markLevelCompleted(level.uuid, game.moveHistory);

      // We want to collect solution data for official levels, even without a user account
      // (signed-out players post under their anonymous uid).
      if (mode === PlayMode.STANDARD) postSolutionData(level.uuid, game.moveHistory, "official_level");
    }
  }, [game]);

  const tileSize = calcBoardTileSize(game.board.width, game.board.height, win);
  const {
    panHandlers, touch, boardRef, remeasure,
    touchPos, pressAnim, pathFollowed, pathAnim,
  } = useGameInput({
    game,
    tileSize,
    onMove: (direction) => dispatch({ type: "move", direction }),
    onJump: (path) => dispatch({ type: "jump", path }),
  });

  const animatedStyles = useMemo(() => ({
    indicator: dynamicStyles.indicator(pressAnim, darkMode),
  }), [darkMode]);

  const introducesMechanics = Object.hasOwn(level, "introduces");
  // Auto-show the tutorial only until the level has been beaten; Help still opens it.
  const autoShowTutorial = introducesMechanics && !level.completed;
  const [showTutorial, setShowTutorial] = useState(autoShowTutorial);
  // PlayLevel stays mounted on "Next Level", so reset the tutorial for the new level.
  useEffect(() => setShowTutorial(autoShowTutorial), [level.uuid]);
  const goNextLevel = nextLevelCallback;

  const toEditor = () => viewCallback(PageView.EDITOR);
  const toLevelSelect = () => viewCallback(PageView.LEVELS);
  const toLevelSearch = () => viewCallback(PageView.LEVELS, 1);
  const modeToBackPage = {
    [PlayMode.STANDARD]: toLevelSelect,
    [PlayMode.PLAYTEST]: () => viewCallback(PageView.MANAGE),
    [PlayMode.SHARED]: toLevelSearch,
  };

  const returnAction = {
    [PlayMode.STANDARD]: { title: "Level Select", onPress: toLevelSelect },
    [PlayMode.PLAYTEST]: { title: "Keep Editing", onPress: toEditor },
    [PlayMode.SHARED]: { title: "Level Search", onPress: toLevelSearch },
  }[mode];
  const pauseMenuItems: NativeMenuItem[] = [
    { id: "undo", title: "Undo Move", sfSymbol: "arrow.uturn.backward", disabled: !canUndo, onPress: () => dispatch({ type: "undo" }) },
    { id: "return", title: returnAction.title, sfSymbol: mode === PlayMode.PLAYTEST ? "hammer" : "door.left.hand.open", onPress: returnAction.onPress },
    { id: "restart", title: "Restart Level", sfSymbol: "arrow.counterclockwise", destructive: true, onPress: () => dispatch({ type: "restart" }) },
  ];

  let postWinActionBtn;
  switch (mode) {
    case PlayMode.STANDARD:
      postWinActionBtn = <SimpleButton
        onPress={goNextLevel}
        icon={graphics.PLAY_ICON}
        text="Next Level" main
        extraMargin={[7.5, 0]}
      />;
      break;
    case PlayMode.PLAYTEST:
      postWinActionBtn = <SimpleButton
        onPress={toEditor}
        text="Keep Editing"
        icon={graphics.HAMMER_ICON_WHITE}
        main
        extraMargin={[7.5, 0]}
      />;
      break;
    case PlayMode.SHARED:
      postWinActionBtn = <SimpleButton
        onPress={async () => {
          const success = await likeUserLevel(level.uuid, userCredential!.user.uid);
          if (!success) {
            Toast.show({
              type: "error",
              text1: "Couldn't like level.",
              text2: "Please check your connection and try again.",
            });
          } else {
            setCanLikeLevel(false);
          }
        }}
        text={"Like Level"}
        icon={graphics.LIKE_ICON_WHITE}
        disabled={!canLikeLevel}
        extraMargin={[7.5, 0]}
        main
      />;
      break;
  }

  return (
    <>
      {/* The page panel already insets for the safe area. */}
      <View style={staticStyles.container}>
        {/* GAMEPLAY COMPONENTS */}
        <View {...panHandlers}>
          <MoveCounter moveCount={game.moveHistory.length} bestMoves={level.bestSolution?.length} />

          <View ref={boardRef} style={staticStyles.centerContents} onLayout={remeasure}>
            <View>
              {/* The board is memoized; everything that moves is drawn on this overlay. */}
              <GameBoard board={game.board} overrideTileSize={tileSize} playerPosition={game.player} />
              <View style={[staticStyles.overlay, { borderRadius: tileSize / 5 }]} pointerEvents="none">
                <Player game={game} touch={touch} darkMode={darkMode} tileSize={tileSize} />

                {pathFollowed.map((square, index) => (
                  <Animated.View key={index} style={[
                    staticStyles.pathSquare,
                    dynamicStyles.pathSquare(square.x, square.y, tileSize, pathAnim, darkMode, index / pathFollowed.length),
                  ]}>
                    <Text style={dynamicStyles.pathSquareText(darkMode)}>{index + 1}</Text>
                  </Animated.View>
                ))}

                <Animated.View style={[
                  staticStyles.indicator,
                  { left: touchPos.x * tileSize, top: touchPos.y * tileSize, width: tileSize, height: tileSize },
                  animatedStyles.indicator,
                ]} />
              </View>
            </View>
          </View>

          <Inventory coins={game.coins} maxCoins={game.maxCoins} keys={game.keys} />
          {game.won && <WinScreen coins={game.coins} moves={game.moveHistory.length} bestMoves={level.bestSolution?.length} />}
        </View>


        <View style={staticStyles.buttonsRow}>
          <SimpleButton text={mode === PlayMode.PLAYTEST ? "Exit" : "Back"} onPress={modeToBackPage[mode]} Svg={BackButton} square extraMargin={[7.5, 0]} />

          {introducesMechanics && !game.won &&
            <SimpleButton onPress={() => setShowTutorial(true)} icon={graphics.LIGHTBULB_ICON} text="Help" square main extraMargin={[7.5, 0]} />}

          {!game.won && <NativeMenu items={pauseMenuItems} title="Menu">
            <SimpleButton icon={graphics.MENU_ICON} text="Menu" main extraMargin={[7.5, 0]} />
          </NativeMenu>}
          {game.won && postWinActionBtn}
        </View>

      </View>
      {introducesMechanics && showTutorial && <TutorialHint introduces={(level as OfficialLevel).introduces!} hideTutorial={() => setShowTutorial(false)} />}
    </>
  );
}

const dynamicStyles = {
  subtitle: (darkMode: boolean): TextStyle => ({
    ...TextStyles.subtitle(darkMode),
    marginBottom: -normalize(5),
  }),
  indicator: (anim: Animated.Value, darkMode: boolean) => ({
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
  pathSquare: (xPos: number, yPos: number, size: number, anim: Animated.Value, darkMode: boolean, progress: number) => ({
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    backgroundColor: (darkMode) ? colors.OFF_WHITE_TRANSPARENT(0.2) : colors.NEAR_BLACK_TRANSPARENT(0.1),
    opacity: anim.interpolate({
      inputRange: [0, progress * 0.9, 1],
      outputRange: [0, 0, 1],
    }),
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5 - 0.25 * (1 - progress), 0.75 - 0.25 * (1 - progress)],
      }),
    }],
  }),
  pathSquareText: (darkMode: boolean): TextStyle => ({
    color: (darkMode) ? colors.OFF_WHITE_TRANSPARENT(0.9) : colors.NEAR_BLACK_TRANSPARENT(0.4),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(24),
  }),
};

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
  overlay: {
    // Inside the board's 1px border, clipped to its rounded corners like the board.
    position: "absolute",
    top: 1, left: 1, right: 1, bottom: 1,
    overflow: "hidden",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: normalize(10),
  },
  indicator: {
    position: "absolute",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 2,
  },
  pathSquare: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});