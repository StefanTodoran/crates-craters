import { useAudioPlayer } from "expo-audio";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Animated, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import BackButton from "../assets/BackButton";
import CurrentToolIndicator from "../components/CurrentToolIndicator";
import GameBoard from "../components/GameBoard";
import SimpleButton from "../components/SimpleButton";
import ToolPicker, { defaultToolOptions, ToolOptions } from "../components/ToolPicker";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, modalBackground } from "../Theme";
import { calcBoardTileSize } from "../util/board";
import { useBoardPosition, useFadeModal } from "../util/hooks";
import { updateLevel } from "../util/loader";
import { getSpawnPosition, Position } from "../util/logic";
import { Tool, wallTool } from "../util/tools";
import { PageView, TileType, UserLevel } from "../util/types";

const successSound = require("../assets/audio/push.wav");
const errorSound = require("../assets/audio/fill.wav");

const MAX_UNDO = 200;

enum GestureMode {
  PLACE,
  ERASE,
}

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
  const win = useWindowDimensions();

  const successSoundPlayer = useAudioPlayer(successSound);
  const errorSoundPlayer = useAudioPlayer(errorSound);
  const playSound = (player: typeof successSoundPlayer) => {
    if (!playAudio) return;
    player.seekTo(0);
    player.play();
  };

  const [currentTool, selectTool] = useState<Tool>(wallTool);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(defaultToolOptions);
  const updateToolOptions = useCallback((update: Partial<ToolOptions>) => setToolOptions(options => ({ ...options, ...update })), []);
  const { modalOpen: toolsModalOpen, anim: fadeToolsAnim, toggleModal: toggleToolsModal } = useFadeModal(200);

  // TODO: Actually compare board state to unmodified level.
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [unmodifiedLevel, setUnmodifiedLevel] = useState<UserLevel>(level);

  // Undo history: the board before each edit gesture, so a whole drag stroke undoes at once.
  const history = useRef<UserLevel["board"][]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const undo = useCallback(() => {
    const board = history.current.pop();
    if (!board) return;
    setCanUndo(history.current.length > 0);
    setUnsavedChanges(true);
    levelCallback({ ...latest.current.level, board });
  }, [levelCallback]);

  const saveChanges = useCallback(() => {
    updateLevel(level, unsavedChanges); // Stores changes to MMKV
    setUnmodifiedLevel(level);
    setUnsavedChanges(false);
  }, [level, unsavedChanges]);

  // Restores the last saved version (not the one from when the editor opened, which
  // would pair an old board with the newer save's completed/bestSolution).
  const discardChanges = useCallback(() => {
    levelCallback(unmodifiedLevel);
    setUnsavedChanges(false);
    history.current = [];
    setCanUndo(false);
  }, [unmodifiedLevel, levelCallback]);

  // level can be undefined (handled by the early return below), so don't dereference it yet.
  const tileSize = level ? calcBoardTileSize(level.board.width, level.board.height, win) : 0;
  const { boardRef, boardPosition, remeasure } = useBoardPosition();

  // The responder is created once, so it reads the current values through this.
  const latest = useRef({ level, tileSize, currentTool, levelCallback, playSound, successSoundPlayer, errorSoundPlayer });
  latest.current = { level, tileSize, currentTool, levelCallback, playSound, successSoundPlayer, errorSoundPlayer };

  const panResponder = useMemo(() => {
    // Per gesture: whether it is placing or erasing, which tile type it started on (an
    // erase only removes that type), and the last tile it touched.
    let gestureMode: GestureMode | undefined;
    let gestureStartTile: TileType | undefined;
    let lastTile: Position | undefined;
    let gestureRecorded = false; // Whether this gesture's starting board is in the history.

    function changeTile(y: number, x: number) {
      const { level, currentTool, levelCallback, playSound, successSoundPlayer, errorSoundPlayer } = latest.current;
      const tileType = level.board.getTile(y, x, true).id;
      if (tileType === TileType.OUTSIDE) return;

      const newBoard = level.board.clone();

      // Clear current spawn position, as we cannot allow multiple spawn locations!
      if (currentTool.tile.id === TileType.SPAWN) {
        if (gestureMode !== undefined) return; // Only on the gesture's first tile.

        const spawnPos = getSpawnPosition(level.board);
        if (tileType === TileType.EMPTY) newBoard.setTile(spawnPos.y, spawnPos.x, { id: 0 }); // Clear the old spawn position.
        gestureMode = GestureMode.PLACE;
      }

      if (tileType === TileType.EMPTY && gestureMode !== GestureMode.ERASE) {
        newBoard.setTile(y, x, currentTool.tile);
        playSound(successSoundPlayer);
        gestureMode = GestureMode.PLACE;
      } else if ((gestureStartTile === undefined || gestureStartTile === tileType) && gestureMode !== GestureMode.PLACE) {
        // Never allow deletion of spawn tile, only replacement to somewhere else.
        if (tileType !== TileType.SPAWN) newBoard.setTile(y, x, { id: 0 });
        if (tileType !== TileType.EMPTY) playSound(errorSoundPlayer);
        gestureMode = GestureMode.ERASE;
        gestureStartTile = tileType;
      } else {
        return; // Nothing to change.
      }

      if (!gestureRecorded) {
        gestureRecorded = true;
        history.current.push(level.board);
        if (history.current.length > MAX_UNDO) history.current.shift();
        setCanUndo(true);
      }

      const newLevel = { ...level, board: newBoard };
      // Move events can arrive faster than re-renders, so build the next change on this one.
      latest.current.level = newLevel;
      setUnsavedChanges(true);
      levelCallback(newLevel);
    }

    function touchedTile(pageX: number, pageY: number): Position {
      const { tileSize } = latest.current;
      return {
        x: Math.floor((pageX - boardPosition.current.x) / tileSize),
        y: Math.floor((pageY - boardPosition.current.y) / tileSize),
      };
    }

    function onGestureStart(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      gestureMode = undefined;
      gestureStartTile = undefined;
      gestureRecorded = false;
      lastTile = touchedTile(gestureState.x0, gestureState.y0);
      changeTile(lastTile.y, lastTile.x);
    }

    function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
      // Move events fire many times per tile; only act when the finger reaches a new one.
      const tile = touchedTile(gestureState.moveX, gestureState.moveY);
      if (!lastTile) {
        lastTile = tile;
        changeTile(tile.y, tile.x);
        return;
      }
      // A fast drag can jump several tiles between move events, so fill in the tiles
      // along the way (one axis step at a time, so diagonals don't skip corners).
      let { x, y } = lastTile;
      while (x !== tile.x || y !== tile.y) {
        const remainingX = tile.x - x, remainingY = tile.y - y;
        if (Math.abs(remainingX) >= Math.abs(remainingY)) x += Math.sign(remainingX);
        else y += Math.sign(remainingY);
        changeTile(y, x);
      }
      lastTile = tile;
    }

    return PanResponder.create({
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

  if (level === undefined) {
    return <Text style={[TextStyles.subtitle(darkMode), { color: colors.RED_THEME.MAIN_COLOR }]}>
      No level being edited!
    </Text>;
  }

  return (
    // The page panel already insets for the safe area.
    <View style={styles.container}>
      <View ref={boardRef} {...panResponder.panHandlers} onLayout={remeasure}>
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
        <View style={{ width: normalize(10) }} />
        <SimpleButton onPress={undo} text="Undo" disabled={!canUndo} />
        <View style={{ width: normalize(10) }} />
        <SimpleButton onPress={toggleToolsModal} text="Change Tool" main={true} icon={graphics.MENU_ICON} />
      </Animated.View>

      {/* START MODAL */}
      {toolsModalOpen && <Animated.View style={[
        styles.modal,
        {
          opacity: fadeToolsAnim,
          backgroundColor: modalBackground(darkMode),
        },
      ]}>
        <ToolPicker options={toolOptions} setOptions={updateToolOptions} onSelect={changeTool} />

        <View style={[styles.section, styles.bottomSection]}>
          <View style={[styles.row, { width: win.width * 0.45 }]}>
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

          <View style={[styles.row, { width: win.width * 0.45 }]}>
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
    </View>
  );
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
  },
  buttonsRow: {
    flexDirection: "row",
    height: normalize(50),
    marginTop: normalize(15),
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    paddingBottom: normalize(24),
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    width: "100%",
  },
});