import { Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState, SafeAreaView, StyleSheet, Text, View } from "react-native";
import BackButton from "../assets/BackButton";
import CurrentToolIndicator from "../components/CurrentToolIndicator";
import GameBoard from "../components/GameBoard";
import MenuButton from "../components/MenuButton";
import SimpleButton from "../components/SimpleButton";
import SliderBar from "../components/SliderBar";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { calcBoardTileSize } from "../util/board";
import { updateLevel } from "../util/loader";
import { getSpawnPosition } from "../util/logic";
import { Tool, tools, wallTool } from "../util/tools";
import { PageView, TileType, UserLevel } from "../util/types";

const win = Dimensions.get("window");

interface ToolPair {
  left: Tool,
  right: Tool,
}

const toolPairs: ToolPair[] = [];
for (let i = 0; i < tools.length - 1; i += 2) {
  toolPairs.push({
    left: tools[i],
    right: tools[i + 1],
  });
}

enum GestureMode {
  PLACE,
  ERASE,
}

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  level: UserLevel, // The level currently being edited. The uuid must not change.
  levelCallback: (newState: UserLevel) => void, // Updates the level (usually board changes).
  playtestLevel: (uuid: string) => void,
}

export default function EditLevel({
  viewCallback,
  level,
  levelCallback,
  playtestLevel,
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

  const [currentTool, selectTool] = useState<Tool>(wallTool);
  const [toolsModalOpen, setToolsModalState] = useState(false);

  const fadeToolsAnim = useRef(new Animated.Value(0)).current;
  const toggleToolsModal = useCallback(() => {
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
  }, [toolsModalOpen]);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [unmodifiedLevel, setUnmodifiedLevel] = useState<UserLevel>(level);

  const saveChanges = useCallback(() => {
    updateLevel(level); // Stores changes to MMKV
    setUnmodifiedLevel(level);
    setUnsavedChanges(false);
  },[level]);

  const discardChanges = useCallback(() => {
    levelCallback(unmodifiedLevel);
    setUnsavedChanges(false);
  }, []);

  const gestureStartMode = useRef<GestureMode>();
  const gestureStartTile = useRef<TileType>();

  const tileSize = calcBoardTileSize(level.board.width, level.board.height, win);
  const xCorrect = -0.5 * tileSize;
  const yCorrect = -1.5 * tileSize;

  const changeTile = useRef<(_y: number, _x: number) => void>(() => undefined);

  useEffect(() => { // TODO: This useEffect may be unnecessary. Evaluate if it is needed, potentially remove.
    changeTile.current = (y: number, x: number) => {
      const newBoard = level.board.clone();
      const tileType = level.board.getTile(y, x, true).id;
      if (tileType === TileType.OUTSIDE) return;

      // Clear current spawn position, as we cannot allow multiple spawn locations!
      if (currentTool.tile.id === TileType.SPAWN) {
        if (gestureStartMode.current !== undefined) return; // Only want to trigger from onGestureStart.

        const spawnPos = getSpawnPosition(level.board);
        if (tileType === TileType.EMPTY) newBoard.setTile(spawnPos.y, spawnPos.x, { id: 0 }); // Clear the old spawn position.
        gestureStartMode.current = GestureMode.PLACE;
      }

      if (tileType === TileType.EMPTY && gestureStartMode.current !== GestureMode.ERASE) {
        newBoard.setTile(y, x, currentTool.tile);
        if (playAudio) playSuccessSound();
        gestureStartMode.current = GestureMode.PLACE;

      } else if (
        (!gestureStartTile.current || gestureStartTile.current === tileType) &&
        gestureStartMode.current !== GestureMode.PLACE
      ) {
        // Never allow deletion of spawn tile, only replacement to somewhere else.
        if (tileType !== TileType.SPAWN) newBoard.setTile(y, x, { id: 0 });
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

  function changeTool(tool: Tool) {
    selectTool(tool);
    toggleToolsModal();
  }

  const [fuseTimer, setFuseTimer] = useState(15);
  const bombTool: Tool = {
    label: "Bomb",
    tile: { id: TileType.BOMB, fuse: fuseTimer },
    icon: graphics.BOMB,
    theme: colors.RED_THEME,
  };

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
      <CurrentToolIndicator tool={currentTool} />

      <Animated.View style={[
        styles.buttonsRow,
        {
          opacity: fadeToolsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        },
      ]}>
        <SimpleButton onPress={() => {
          saveChanges();
          viewCallback(PageView.MANAGE);
        }} text={unsavedChanges ? "Save & Exit" : "Exit"}/>
        <View style={{ width: normalize(15) }} />
        <SimpleButton onPress={toggleToolsModal} text="Change Tool" main={true} />
      </Animated.View>

      {/* START MODAL */}
      {toolsModalOpen && <Animated.View style={[
        styles.modal,
        {
          opacity: fadeToolsAnim,
          backgroundColor: darkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
        },
      ]}>
          <View style={styles.section}>
            {toolPairs.map((pair, index) =>
              <View key={index} style={styles.row}>
                <MenuButton
                  label={pair.left.label}
                  icon={pair.left.icon}
                  onPress={() => changeTool(pair.left)}
                  theme={pair.left.theme}
                  fillWidth
                />
                <MenuButton
                  label={pair.right.label}
                  icon={pair.right.icon}
                  onPress={() => changeTool(pair.right)}
                  theme={pair.right.theme}
                  fillWidth
                />
              </View>
            )}
            <View style={{ height: 15 }} />
            <View style={styles.row}>
              <SliderBar
                label="Fuse Timer" value={fuseTimer} units={" turns"}
                minValue={1} maxValue={100} changeCallback={setFuseTimer}
                theme={colors.RED_THEME}
                showSteppers
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="Bomb"
                icon={bombTool.icon}
                onPress={() => changeTool(bombTool)}
                theme={bombTool.theme}
                fillWidth
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <SimpleButton
                onPress={discardChanges}
                doConfirmation="Are you sure you want to discard your unsaved changes?"
                text="Discard Changes"
                icon={graphics.EXPLOSION}
                theme={colors.RED_THEME}
                disabled={!unsavedChanges}
                fillWidth
                square
                extraMargin={6}
              />
              <SimpleButton
                onPress={saveChanges}
                text="Save Changes"
                icon={graphics.SAVE_ICON}
                theme={colors.GREEN_THEME}
                disabled={!unsavedChanges}
                fillWidth
                extraMargin={6}
                main
              />
            </View>

            <View style={styles.row}>
              <SimpleButton
                onPress={toggleToolsModal}
                Svg={BackButton}
                text="Close Menu"
                fillWidth
                extraMargin={6}
              />
              <SimpleButton
                onPress={() => {
                  saveChanges();
                  playtestLevel(level.uuid);
                  viewCallback(PageView.PLAY);
                }}
                text="Playtest"
                icon={graphics.PLAY_ICON}
                square
                fillWidth
                extraMargin={6}
                main
              />
            </View>
          </View>
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
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  section: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: normalize(6),
    marginBottom: normalize(18),
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    width: win.width * 0.45,
  },
  buttonsRow: {
    flexDirection: "row",
    height: normalize(50),
    marginTop: normalize(15),
  },
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: normalize(36),
    paddingBottom: normalize(24),
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    width: "100%",
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