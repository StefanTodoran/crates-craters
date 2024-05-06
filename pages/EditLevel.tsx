import { View, ScrollView, StyleSheet, Dimensions, Animated, Text, SafeAreaView, PanResponder, GestureResponderEvent, PanResponderGestureState } from "react-native";
import { useState, useRef, useEffect, useContext, useMemo } from "react";
import { Sound } from "expo-av/build/Audio";
import { Audio } from "expo-av";

import SimpleButton from "../components/SimpleButton";
import MenuButton from "../components/MenuButton";
import GameBoard from "../components/GameBoard";
import SliderBar from "../components/SliderBar";

import TextStyles, { normalize } from "../TextStyles";
import { BoardTile, Direction, PageView, TileType, UserLevel, createBlankBoard } from "../util/types";
import { boundTileAt, cloneBoard, getSpawnPosition } from "../util/logic";
import { colors, graphics } from "../Theme";
import GlobalContext from "../GlobalContext";
import { calcBoardTileSize } from "../util/board";

const win = Dimensions.get("window");

enum GestureMode {
  PLACE,
  ERASE,
}

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  level: UserLevel, // The level currently being edited. The uuid must not change.
  levelCallback: (newState: UserLevel) => void, // Updates the level (usually board changes).

  playtestLevel: () => void,
  storeChanges: (newState: UserLevel) => void,
}

export default function EditLevel({
  viewCallback,
  level,
  levelCallback,
  playtestLevel,
  storeChanges,
}: Props) {
  const { darkMode, playAudio } = useContext(GlobalContext);

  // ===================
  // SOUND RELATED SETUP
  // ===================
  const [successSound, setSuccessSound] = useState<Sound>();
  const [errorSound, setErrorSound] = useState<Sound>();

  async function playSuccessSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/push.wav"));
    setSuccessSound(sound);
    await sound.playAsync();
  }
  async function playErrorSound() {
    const { sound } = await Audio.Sound.createAsync(require("../assets/audio/fill.wav"));
    setErrorSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return successSound ? () => { successSound.unloadAsync(); } : undefined;
  }, [successSound]);
  useEffect(() => {
    return errorSound ? () => { errorSound.unloadAsync(); } : undefined;
  }, [errorSound]);
  // ===============
  // END SOUND SETUP
  // ===============

  const [currentTool, selectTool] = useState<BoardTile>({ id: TileType.WALL });
  const [toolsModalOpen, setToolsModalState] = useState(false);

  const fadeToolsAnim = useRef(new Animated.Value(0)).current;
  function toggleToolsModal() {
    const start = (toolsModalOpen) ? 1 : 0;
    const end = (toolsModalOpen) ? 0 : 1;
    const modalWasOpen = toolsModalOpen;

    if (!modalWasOpen) { // If modal was not open
      setToolsModalState(true); // Set modal to open
    }

    fadeToolsAnim.setValue(start);
    Animated.timing(fadeToolsAnim, {
      toValue: end,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      if (modalWasOpen) {
        setToolsModalState(false);
      }
    });
  }

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [unmodifiedLevel, setUnmodifiedLevel] = useState<UserLevel>(level);

  function saveChanges() {
    storeChanges(level);
    setUnmodifiedLevel(level);
    setUnsavedChanges(false);
  }

  function discardChanges() {
    levelCallback(unmodifiedLevel);
    setUnsavedChanges(false);
  }

  const gestureStartMode = useRef<GestureMode>();
  const gestureStartTile = useRef<TileType>();

  const tileSize = calcBoardTileSize(level.board[0].length, level.board.length, win);
  const xCorrect = -0.5 * tileSize;
  const yCorrect = -1 * tileSize;

  const changeTile = useRef<(_y: number, _x: number) => void>(() => undefined);

  useEffect(() => { // TODO: This useEffect may be unnecessary. Evaluate if it is needed, potentially remove.
    changeTile.current = (y: number, x: number) => {
      const newBoard = cloneBoard(level.board);
      const tileType = boundTileAt(y, x, level.board).id;
      if (tileType === TileType.OUTSIDE) return;

      // Clear current spawn position, as we cannot allow multiple spawn locations!
      if (currentTool.id === TileType.SPAWN) {
        if (gestureStartMode.current !== undefined) return; // Only want to trigger from onGestureStart.

        const spawnPos = getSpawnPosition(level.board);
        if (tileType === TileType.EMPTY) newBoard[spawnPos.y][spawnPos.x] = { id: 0 }; // Clear the old spawn position.
        gestureStartMode.current = GestureMode.PLACE;
      }

      if (tileType === TileType.EMPTY && gestureStartMode.current !== GestureMode.ERASE) {
        newBoard[y][x] = currentTool;
        if (playAudio) playSuccessSound();
        gestureStartMode.current = GestureMode.PLACE;

      } else if (
        (!gestureStartTile.current || gestureStartTile.current === tileType) &&
        gestureStartMode.current !== GestureMode.PLACE
      ) {
        // Never allow deletion of spawn tile, only replacement to somewhere else.
        if (tileType !== TileType.SPAWN) newBoard[y][x] = { id: 0 };
        if (tileType !== TileType.EMPTY && playAudio) playErrorSound();
        gestureStartMode.current = GestureMode.ERASE;
        gestureStartTile.current = tileType;
      }

      setUnsavedChanges(true);
      levelCallback({
        ...level,
        board: newBoard,
      });
    }
  }, [level, tileSize, currentTool]);

  const panResponder = useMemo(() => {
    function onGestureStart(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const pressX = pressToIndex(gestureState.x0, tileSize, xCorrect);
      const pressY = pressToIndex(gestureState.y0, tileSize, yCorrect);

      gestureStartMode.current = undefined;
      gestureStartTile.current = undefined;
      changeTile.current(pressY, pressX);
    }

    function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const pressX = pressToIndex(gestureState.moveX, tileSize, xCorrect);
      const pressY = pressToIndex(gestureState.moveY, tileSize, yCorrect);
      changeTile.current(pressY, pressX);
    }

    return PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: onGestureStart,
      onPanResponderMove: onGestureMove,
    });
  }, []);

  function changeTool(tool: BoardTile) {
    selectTool(tool);
    toggleToolsModal();
  }

  function clearBoard() {
    const newBoard = createBlankBoard();
    setUnsavedChanges(true);
    levelCallback({
      ...level,
      board: newBoard,
    });
  }

  const [fuseTimer, setFuseTimer] = useState(15);

  if (level === undefined) {
    return <Text style={[TextStyles.subtitle(darkMode), { color: colors.RED_THEME.MAIN_COLOR }]}>
      No level being edited
    </Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View {...panResponder.panHandlers}>
        <GameBoard board={level.board} overrideTileSize={tileSize} />
        {/* Like invertory but show current tool */}
      </View>

      <Animated.View style={[
        styles.buttonsRow,
        {
          opacity: fadeToolsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}>
        <SimpleButton onPress={toggleToolsModal} text="Tools & Options" main={true} />
        <View style={{ width: normalize(15) }} />
        <SimpleButton onPress={() => {
          saveChanges();
          viewCallback(PageView.MANAGE);
        }} text="Save & Exit" />
      </Animated.View>

      {/* START MODAL */}
      {toolsModalOpen && <Animated.View style={[
        styles.modal,
        {
          opacity: fadeToolsAnim,
          backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.85) : "rgba(255, 255, 255, 0.85)",
        },
      ]}>
        <ScrollView overScrollMode="never" style={{ width: "100%" }}>

          <View style={styles.section}>
            <Text style={[TextStyles.subtitle(darkMode), styles.subtitle]}>Tools</Text>
            <View style={styles.row}>
              <MenuButton
                label="Crate"
                icon={graphics.CRATE}
                onPress={() => changeTool({ id: TileType.CRATE })}
                fillWidth
              />
              <MenuButton
                label="Crater"
                icon={graphics.CRATER}
                onPress={() => changeTool({ id: TileType.CRATER })}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Wall"
                icon={graphics.WALL_ICON}
                onPress={() => changeTool({ id: TileType.WALL })}
                fillWidth
              />
              <MenuButton
                label="Spawn"
                icon={graphics.PLAYER}
                onPress={() => changeTool({ id: TileType.SPAWN })}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Door"
                icon={graphics.DOOR}
                onPress={() => changeTool({ id: TileType.DOOR })}
                theme={colors.GREEN_THEME}
                fillWidth
              />
              <MenuButton
                label="Key"
                icon={graphics.KEY}
                onPress={() => changeTool({ id: TileType.KEY })}
                theme={colors.GREEN_THEME}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Flag"
                icon={graphics.FLAG}
                onPress={() => changeTool({ id: TileType.FLAG })}
                theme={colors.YELLOW_THEME}
                fillWidth
              />
              <MenuButton
                label="Coin"
                icon={graphics.COIN}
                onPress={() => changeTool({ id: TileType.COIN })}
                theme={colors.YELLOW_THEME}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Left"
                icon={graphics.ONE_WAY_LEFT}
                onPress={() => changeTool({ id: TileType.ONEWAY, orientation: Direction.LEFT })}
                theme={colors.BLUE_THEME}
                fillWidth
              />
              <MenuButton
                label="Right"
                icon={graphics.ONE_WAY_RIGHT}
                onPress={() => changeTool({ id: TileType.ONEWAY, orientation: Direction.RIGHT })}
                theme={colors.BLUE_THEME}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Up"
                icon={graphics.ONE_WAY_UP}
                onPress={() => changeTool({ id: TileType.ONEWAY, orientation: Direction.UP })}
                theme={colors.BLUE_THEME}
                fillWidth
              />
              <MenuButton
                label="Down"
                icon={graphics.ONE_WAY_DOWN}
                onPress={() => changeTool({ id: TileType.ONEWAY, orientation: Direction.DOWN })}
                theme={colors.BLUE_THEME}
                fillWidth
              />
            </View>
            <View style={{ height: 15 }} />
            <View style={styles.row}>
              <SliderBar
                label="Fuse Timer" value={fuseTimer} units={" turns"}
                minValue={1} maxValue={100} changeCallback={setFuseTimer}
                mainColor={darkMode ? "#F79B9B" : "#FB6C6C"} // TODO: Replace this with colors.RED_THEME
                knobColor={darkMode ? "#1E0D0D" : "#FFFAFA"}
                showSteppers
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Bomb"
                icon={graphics.BOMB}
                onPress={() => changeTool({ id: TileType.BOMB, fuse: fuseTimer })}
                theme={colors.RED_THEME}
                fillWidth
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[TextStyles.subtitle(darkMode), styles.subtitle]}>Options</Text>
            <View style={styles.row}>
              <MenuButton
                onLongPress={clearBoard}
                icon={graphics.DELETE_ICON}
                theme={colors.RED_THEME}
                label="Clear Board     (Long Press)"
                allowOverflow
                fillWidth
              />
              <MenuButton
                onPress={() => {
                  saveChanges();
                  playtestLevel();
                }}
                label="Playtest"
                icon={graphics.PLAYER}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                onPress={saveChanges}
                label="Save Changes"
                icon={graphics.SAVE_ICON}
                theme={colors.GREEN_THEME}
                disabled={!unsavedChanges}
                fillWidth
              />
              <MenuButton
                onPress={discardChanges}
                label="Discard Changes"
                icon={graphics.EXPLOSION}
                theme={colors.RED_THEME}
                disabled={!unsavedChanges}
                fillWidth
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                onPress={toggleToolsModal}
                label="Close Menu"
                icon={graphics.DOOR_ICON}
                fillWidth
              />
            </View>
          </View>

        </ScrollView>
      </Animated.View>}
      {/* END MODAL */}
    </SafeAreaView>
  );
}

function pressToIndex(touchPos: number, tileSize: number, correction: number) {
  return Math.floor((touchPos + correction) / tileSize);
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "100%",
    height: "100%",
  },
  section: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: normalize(36),
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    width: win.width * 0.45,
  },
  buttonsRow: {
    flexDirection: "row",
    height: normalize(50),
  },
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    // borderTopWidth: 1,
    // borderBottomWidth: 1,
    // borderColor: colors.MAIN_PURPLE_TRANSPARENT(0.3),
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 5,
    marginBottom: 15,
    color: colors.MAIN_PURPLE_TRANSPARENT(0.8),
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  subtitle: {
    marginTop: normalize(32),
    marginBottom: normalize(8),
  },
  inputContainer: {
    position: "relative",
    width: 4 * win.width / 5,
    marginBottom: 10,
    borderColor: colors.MAIN_PURPLE,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
});