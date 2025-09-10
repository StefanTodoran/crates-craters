import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, ImageSourcePropType, PanResponder, PanResponderGestureState, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { diamondTool, getOneWayTool, metalCrateTool, spawnTool, Tool, tools, wallTool } from "../util/tools";
import { PageView, rotationToDirection, TileType, UserLevel } from "../util/types";

import { useAudioPlayer } from "expo-audio";
import FilterChip from "../components/FilterChip";
const successSound = require("../assets/audio/push.wav");
const errorSound = require("../assets/audio/fill.wav");

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

enum OneWayMode {
  ONE_DIR = "One Direction",
  OPPOSITE_SIDES = "Opposite Sides",
  CORNER = "Corner",
}

const oneWayModeToIcon: Record<OneWayMode, ImageSourcePropType> = {
  [OneWayMode.ONE_DIR]: graphics.ONE_WAY_ONE_DIR,
  [OneWayMode.OPPOSITE_SIDES]: graphics.ONE_WAY_OPPOSITE_SIDES,
  [OneWayMode.CORNER]: graphics.ONE_WAY_CORNER,
};

interface Props {
  viewCallback: (newView: PageView, pageNum?: number) => void, // Sets the current view of the application. 
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

  const successSoundPlayer = useAudioPlayer(successSound);
  const playSuccessSound = () => {
    successSoundPlayer.seekTo(0);
    successSoundPlayer.play();
  }
  const errorSoundPlayer = useAudioPlayer(errorSound);
  const playErrorSound = () => {
    errorSoundPlayer.seekTo(0);
    errorSoundPlayer.play();
  }

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

  // TODO: Actually compare board state to unmodified level.
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [unmodifiedLevel, setUnmodifiedLevel] = useState<UserLevel>(level);

  const saveChanges = useCallback(() => {
    updateLevel(level, unsavedChanges); // Stores changes to MMKV
    setUnmodifiedLevel(level);
    setUnsavedChanges(false);
  }, [level]);

  const discardChanges = useCallback(() => {
    levelCallback(unmodifiedLevel);
    setUnsavedChanges(false);
  }, []);

  const gestureStartMode = useRef<GestureMode>(undefined);
  const gestureStartTile = useRef<TileType>(undefined);

  const tileSize = calcBoardTileSize(level.board.width, level.board.height, win);
  const changeTile = useRef<(_y: number, _x: number) => void>(() => undefined);
  const boardPosition = useRef({ x: 0, y: 0 });

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
      const pressX = pressToIndex(gestureState.x0, tileSize, -boardPosition.current.x);
      const pressY = pressToIndex(gestureState.y0, tileSize, -boardPosition.current.y);

      gestureStartMode.current = undefined;
      gestureStartTile.current = undefined;
      changeTile.current(pressY, pressX);
    }

    function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      const pressX = pressToIndex(gestureState.moveX, tileSize, -boardPosition.current.x);
      const pressY = pressToIndex(gestureState.moveY, tileSize, -boardPosition.current.y);
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

  const [oneWayRotation, setOneWayRotation] = useState(0);
  const [oneWayMode, setOneWayMode] = useState<OneWayMode>(OneWayMode.ONE_DIR);

  if (level === undefined) {
    return <Text style={[TextStyles.subtitle(darkMode), { color: colors.RED_THEME.MAIN_COLOR }]}>
      No level being edited!
    </Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View {...panResponder.panHandlers} onLayout={(event) => {
        event.persist();
        setTimeout(() => {
          // For some reason right after the layout event is fired, the measure
          // function doesn't return the correct values. So we need to wait a bit
          // before calling it.
          event.target.measure(
            (_x, _y, _width, _height, pageX, pageY) => {
              boardPosition.current = { x: pageX, y: pageY };
            },
          );
        }, 1000);
      }}>
        <GameBoard board={level.board} overrideTileSize={tileSize} />
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
          viewCallback(PageView.MANAGE, 1);
        }} text={unsavedChanges ? "Save & Exit" : "Exit"} Svg={BackButton} />
        <View style={{ width: normalize(15) }} />
        <SimpleButton onPress={toggleToolsModal} text="Change Tool" main={true} icon={graphics.MENU_ICON} />
      </Animated.View>

      {/* START MODAL */}
      {toolsModalOpen && <Animated.View style={[
        styles.modal,
        {
          opacity: fadeToolsAnim,
          backgroundColor: darkMode ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
        },
      ]}>
        <ScrollView style={styles.modalScrollView} contentContainerStyle={{ paddingTop: normalize(18), paddingBottom: normalize(24) }}>
          <View style={styles.section}>
            <Text style={TextStyles.subtitle(darkMode, colors.DIM_GRAY)}>
              Basic Tiles
            </Text>
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
            <View style={styles.row}>
              <MenuButton
                label={spawnTool.label}
                icon={spawnTool.icon}
                onPress={() => changeTool(spawnTool)}
                fillWidth
              />
            </View>

            {/* BOMB TOOL */}
            <View style={{ height: normalize(20) }} />
            <Text style={TextStyles.subtitle(darkMode, colors.RED_THEME.MAIN_COLOR)}>
              Bomb Tiles
            </Text>
            <View style={styles.row}>
              <SliderBar
                label="Fuse Timer" value={fuseTimer} units={" turns"}
                minValue={1} maxValue={99} changeCallback={setFuseTimer}
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
            <View style={styles.row}>
              <MenuButton
                label={metalCrateTool.label}
                icon={metalCrateTool.icon}
                onPress={() => changeTool(metalCrateTool)}
                theme={metalCrateTool.theme}
                fillWidth
              />
              <MenuButton
                label={diamondTool.label}
                icon={diamondTool.icon}
                onPress={() => changeTool(diamondTool)}
                theme={diamondTool.theme}
                fillWidth
              />
            </View>

            {/* ONE WAY TOOL */}
            <View style={{ height: normalize(20) }} />
            <Text style={TextStyles.subtitle(darkMode, colors.BLUE_THEME.MAIN_COLOR)}>
              One Way Tiles
            </Text>
            <View style={styles.row}>
              <SliderBar
                label="Rotation" value={oneWayRotation} units={" deg"} stepSize={90}
                minValue={0} maxValue={oneWayMode === OneWayMode.OPPOSITE_SIDES ? 90 : 270} changeCallback={setOneWayRotation}
                theme={colors.BLUE_THEME}
                showSteppers
                stepperWrapAround
              />
            </View>
            <View style={{ height: normalize(10) }} />
            <View style={styles.row}>
              <FilterChip
                text={"One Direction"}
                active={oneWayMode === OneWayMode.ONE_DIR}
                onPress={() => setOneWayMode(OneWayMode.ONE_DIR)}
                theme={colors.BLUE_THEME}
              />
              <FilterChip
                text={"Opposite Sides"}
                active={oneWayMode === OneWayMode.OPPOSITE_SIDES}
                onPress={() => {
                  setOneWayMode(OneWayMode.OPPOSITE_SIDES);
                  setOneWayRotation(Math.min(oneWayRotation, 90));
                }}
                theme={colors.BLUE_THEME}
              />
              <FilterChip
                text={"Corner"}
                active={oneWayMode === OneWayMode.CORNER}
                onPress={() => setOneWayMode(OneWayMode.CORNER)}
                theme={colors.BLUE_THEME}
              />
            </View>
            <View style={styles.row}>
              <MenuButton
                label="One Way"
                icon={oneWayModeToIcon[oneWayMode]}
                iconRotation={oneWayRotation}
                onPress={() => {
                  let blocked = [];
                  switch (oneWayMode) {
                    case OneWayMode.ONE_DIR:
                      blocked = [rotationToDirection(oneWayRotation)];
                      break;
                    case OneWayMode.OPPOSITE_SIDES:
                      blocked = [rotationToDirection(oneWayRotation), rotationToDirection(oneWayRotation + 180)];
                      break;
                    case OneWayMode.CORNER:
                      blocked = [rotationToDirection(oneWayRotation), rotationToDirection(oneWayRotation - 90)];
                      break;
                  }

                  const oneWayTool = getOneWayTool(blocked);
                  changeTool(oneWayTool);
                }}
                theme={colors.BLUE_THEME}
                fillWidth
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.section, styles.bottomSection]}>
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
              disabled={unsavedChanges}
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
    marginBottom: normalize(18),
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: colors.DIM_GRAY_TRANSPARENT(0.25),
    paddingTop: normalize(16),
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
    paddingBottom: normalize(24),
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    width: "100%",
  },
  modalScrollView: {
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