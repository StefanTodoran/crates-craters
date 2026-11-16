import { useAudioPlayer } from "expo-audio";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { Alert, Image, ImageSourcePropType, LayoutChangeEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, View } from "react-native";
import BackButton from "../assets/BackButton";
import GameBoard from "../components/GameBoard";
import ResponsivePressable from "../components/ResponsivePressable";
import SimpleButton from "../components/SimpleButton";
import { defaultToolOptions, OPTIONS_HEIGHT, PlacedBombRow, resolveTool, STRIP_HEIGHT, ToolOptions, ToolOptionsRow, ToolStrip } from "../components/ToolStrip";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { useBoardPosition } from "../util/hooks";
import { hapticErase, hapticSelection } from "../util/haptics";
import { compressBoardData, updateLevel } from "../util/loader";
import { getSpawnPosition, Position } from "../util/logic";
import { wallTool } from "../util/tools";
import { BombTile, Direction, OneWayTile, PageView, TileType, UserLevel } from "../util/types";

const successSound = require("../assets/audio/push.wav");
const errorSound = require("../assets/audio/fill.wav");

const MAX_UNDO = 200;
const LONG_PRESS_MS = 400;

enum GestureMode {
  PLACE,
  ERASE,
  DONE, // The gesture already did its one thing (rotated a tile, opened a bomb's fuse).
}

const TOOLBAR_HEIGHT = normalize(46);
const GAP = normalize(10);
const TOOLBAR_ICON = normalize(30);

interface Props {
  viewCallback: (newView: PageView, pageNum?: number) => void, // Sets the current view of the application.
  level: UserLevel, // The level currently being edited. The uuid must not change.
  levelCallback: (newState: UserLevel) => void, // Updates the level (usually board changes).
  playtestLevel: (uuid: string) => void,
}

type Board = UserLevel["board"];

export default function EditLevel({
  viewCallback,
  level,
  levelCallback,
  playtestLevel,
}: Props) {
  const { darkMode, playAudio } = useContext(GlobalContext);

  const successSoundPlayer = useAudioPlayer(successSound);
  const errorSoundPlayer = useAudioPlayer(errorSound);
  const playSound = (player: typeof successSoundPlayer) => {
    if (!playAudio) return;
    player.seekTo(0);
    player.play();
  };

  const [toolLabel, setToolLabel] = useState(wallTool.label);
  const [toolOptions, setToolOptions] = useState<ToolOptions>(defaultToolOptions);
  const updateToolOptions = useCallback((update: Partial<ToolOptions>) => setToolOptions(options => ({ ...options, ...update })), []);
  const currentTool = useMemo(() => resolveTool(toolLabel, toolOptions), [toolLabel, toolOptions]);

  // A placed bomb whose fuse is being edited (after a long press on it).
  const [editingBomb, setEditingBomb] = useState<Position>();

  const [unmodifiedLevel, setUnmodifiedLevel] = useState<UserLevel>(level);
  // Compares boards, so undoing back to the saved board clears the unsaved dot.
  const savedBoard = useMemo(() => unmodifiedLevel ? compressBoardData(unmodifiedLevel.board) : "", [unmodifiedLevel]);
  const unsavedChanges = useMemo(() => !!level && compressBoardData(level.board) !== savedBoard, [level?.board, savedBoard]);

  // Undo and redo history: whole boards, one per edit gesture, so a drag stroke undoes at once.
  const history = useRef<Board[]>([]);
  const future = useRef<Board[]>([]);
  const [historySizes, setHistorySizes] = useState({ undo: 0, redo: 0 });
  const syncHistorySizes = () => setHistorySizes({ undo: history.current.length, redo: future.current.length });

  /** Call before an edit changes the board: makes it undoable and clears redo. */
  const recordEdit = (board: Board) => {
    history.current.push(board);
    if (history.current.length > MAX_UNDO) history.current.shift();
    future.current = [];
    syncHistorySizes();
  };

  const applyBoard = (board: Board) => {
    const newLevel = { ...latest.current.level, board };
    // Move events can arrive faster than re-renders, so build the next change on this one.
    latest.current.level = newLevel;
    levelCallback(newLevel);
  };

  const undo = () => {
    const board = history.current.pop();
    if (!board) return;
    future.current.push(latest.current.level.board);
    syncHistorySizes();
    setEditingBomb(undefined);
    applyBoard(board);
  };

  const redo = () => {
    const board = future.current.pop();
    if (!board) return;
    history.current.push(latest.current.level.board);
    syncHistorySizes();
    setEditingBomb(undefined);
    applyBoard(board);
  };

  const saveChanges = useCallback(() => {
    updateLevel(level, unsavedChanges); // Stores changes to MMKV
    setUnmodifiedLevel(level);
  }, [level, unsavedChanges]);

  // Leaving the editor (Manage or Playtest) asks to save or discard unsaved changes.
  const confirmLeave = (message: string, leave: () => void) => {
    if (!unsavedChanges) return leave();
    Alert.alert("Unsaved changes", message, [
      // Restores the last saved version (not the one from when the editor opened, which
      // would pair an old board with the newer save's completed/bestSolution).
      { text: "Discard", style: "destructive", onPress: () => { levelCallback(unmodifiedLevel); leave(); } },
      { text: "Cancel", style: "cancel" },
      { text: "Save", onPress: () => { saveChanges(); leave(); } },
    ]);
  };

  const exit = () => confirmLeave("Save your changes before leaving?", () => viewCallback(PageView.MANAGE, 1));

  // Playtest plays the stored level, so it's the saved version either way.
  const playtest = () => confirmLeave("Save your changes before playtesting?", () => {
    playtestLevel(level.uuid);
    viewCallback(PageView.PLAY);
  });

  // The board gets whatever height the toolbar, tool strip and options leave free.
  const [area, setArea] = useState<{ width: number, height: number }>();
  const onAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== area?.width || height !== area?.height) setArea({ width, height });
  };
  const contentWidth = area ? area.width * 0.9 : 0;
  const boardSpace = area ? area.height - TOOLBAR_HEIGHT - STRIP_HEIGHT - OPTIONS_HEIGHT - 5 * GAP : 0; // 3 gaps, plus padding.
  const tileSize = level && area ?
    Math.floor(Math.min(contentWidth / level.board.width, boardSpace / level.board.height)) : 0;
  const { boardRef, boardPosition, remeasure } = useBoardPosition();

  // The responder is created once, so it reads the current values through this.
  const latest = useRef({ level, tileSize, currentTool, playSound, successSoundPlayer, errorSoundPlayer, recordEdit, applyBoard, setEditingBomb, setToolLabel, updateToolOptions });
  latest.current = { level, tileSize, currentTool, playSound, successSoundPlayer, errorSoundPlayer, recordEdit, applyBoard, setEditingBomb, setToolLabel, updateToolOptions };

  const panResponder = useMemo(() => {
    // Per gesture: whether it is placing or erasing, which tile type it started on (an
    // erase only removes that type, except with the eraser), and the last tile it touched.
    let gestureMode: GestureMode | undefined;
    let gestureStartTile: TileType | undefined;
    let lastTile: Position | undefined;
    let gestureRecorded = false; // Whether this gesture's starting board is in the history.
    // A touch that starts on a bomb waits: a long press edits its fuse, anything else
    // (a tap, or dragging away) acts on it as usual.
    let pendingBomb: Position | undefined;
    let longPressTimer: ReturnType<typeof setTimeout> | undefined;

    function commit(newBoard: Board) {
      const { level, recordEdit, applyBoard } = latest.current;
      if (!gestureRecorded) {
        gestureRecorded = true;
        recordEdit(level.board);
      }
      applyBoard(newBoard);
    }

    function changeTile(y: number, x: number) {
      const { level, currentTool, playSound, successSoundPlayer, errorSoundPlayer } = latest.current;
      if (gestureMode === GestureMode.DONE) return;
      const tileType = level.board.getTile(y, x, true).id;
      if (tileType === TileType.OUTSIDE) return;

      const newBoard = level.board.clone();
      const erase = () => {
        newBoard.setTile(y, x, { id: TileType.EMPTY });
        playSound(errorSoundPlayer);
        hapticErase();
      };

      if (currentTool.tile.id === TileType.EMPTY) { // Eraser: removes anything but the spawn.
        if (tileType === TileType.EMPTY || tileType === TileType.SPAWN) return;
        erase();
        gestureMode = GestureMode.ERASE;
        return commit(newBoard);
      }

      // Tapping a placed one-way tile with the one-way tool turns it clockwise.
      if (currentTool.tile.id === TileType.ONEWAY && tileType === TileType.ONEWAY && gestureMode === undefined) {
        const tile = level.board.getTile(y, x) as OneWayTile;
        newBoard.setTile(y, x, { id: TileType.ONEWAY, blocked: tile.blocked.map(dir => ((dir + 1) % 4) as Direction) });
        playSound(successSoundPlayer);
        hapticSelection();
        gestureMode = GestureMode.DONE;
        return commit(newBoard);
      }

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
        hapticSelection();
        gestureMode = GestureMode.PLACE;
      } else if ((gestureStartTile === undefined || gestureStartTile === tileType) && gestureMode !== GestureMode.PLACE) {
        // Never allow deletion of spawn tile, only replacement to somewhere else.
        if (tileType === TileType.SPAWN) return;
        if (tileType !== TileType.EMPTY) erase();
        gestureMode = GestureMode.ERASE;
        gestureStartTile = tileType;
      } else {
        return; // Nothing to change.
      }
      commit(newBoard);
    }

    function touchedTile(pageX: number, pageY: number): Position {
      const { tileSize } = latest.current;
      return {
        x: Math.floor((pageX - boardPosition.current.x) / tileSize),
        y: Math.floor((pageY - boardPosition.current.y) / tileSize),
      };
    }

    /** Acts on the bomb the gesture started on, as an ordinary touch. */
    function releasePendingBomb() {
      clearTimeout(longPressTimer);
      if (!pendingBomb) return;
      const { y, x } = pendingBomb;
      pendingBomb = undefined;
      changeTile(y, x);
    }

    function onGestureStart(_evt: unknown, gestureState: PanResponderGestureState) {
      gestureMode = undefined;
      gestureStartTile = undefined;
      gestureRecorded = false;
      latest.current.setEditingBomb(undefined);
      lastTile = touchedTile(gestureState.x0, gestureState.y0);

      const { level, currentTool } = latest.current;
      const startsOnBomb = level.board.getTile(lastTile.y, lastTile.x, true).id === TileType.BOMB;
      if (startsOnBomb && currentTool.tile.id !== TileType.EMPTY) {
        const bomb = lastTile;
        pendingBomb = bomb;
        longPressTimer = setTimeout(() => {
          pendingBomb = undefined;
          gestureMode = GestureMode.DONE;
          const { level, setEditingBomb, setToolLabel, updateToolOptions } = latest.current;
          const fuse = (level.board.getTile(bomb.y, bomb.x) as BombTile).fuse;
          hapticSelection();
          setEditingBomb(bomb);
          // New bombs get the same fuse, which is usually what you want next.
          setToolLabel("Bomb");
          updateToolOptions({ fuseTimer: fuse });
        }, LONG_PRESS_MS);
        return;
      }
      changeTile(lastTile.y, lastTile.x);
    }

    function onGestureMove(_evt: unknown, gestureState: PanResponderGestureState) {
      // Move events fire many times per tile; only act when the finger reaches a new one.
      const tile = touchedTile(gestureState.moveX, gestureState.moveY);
      if (!lastTile) {
        lastTile = tile;
        changeTile(tile.y, tile.x);
        return;
      }
      if (tile.x === lastTile.x && tile.y === lastTile.y) return;
      releasePendingBomb(); // Dragged off the bomb before the long press: act on it first.
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
      onPanResponderRelease: releasePendingBomb, // A tap on a bomb.
      onPanResponderTerminate: () => { clearTimeout(longPressTimer); pendingBomb = undefined; },
    });
  }, []);

  // Fuse edits on a placed bomb: one undo step per editing session.
  const bombEditRecorded = useRef(false);
  const editedBombFuse = editingBomb && level?.board.getTile(editingBomb.y, editingBomb.x, true).id === TileType.BOMB ?
    (level.board.getTile(editingBomb.y, editingBomb.x) as BombTile).fuse : undefined;
  if (!editingBomb) bombEditRecorded.current = false;

  const setPlacedFuse = (fuse: number) => {
    if (!editingBomb || fuse === editedBombFuse) return;
    if (!bombEditRecorded.current) {
      bombEditRecorded.current = true;
      recordEdit(latest.current.level.board);
    }
    const newBoard = latest.current.level.board.clone();
    newBoard.setTile(editingBomb.y, editingBomb.x, { id: TileType.BOMB, fuse });
    applyBoard(newBoard);
    updateToolOptions({ fuseTimer: fuse });
  };

  const selectTool = (label: string) => {
    setEditingBomb(undefined);
    setToolLabel(label);
  };

  if (level === undefined) {
    return <Text style={[TextStyles.subtitle(darkMode), { color: colors.RED_THEME.MAIN_COLOR }]}>
      No level being edited!
    </Text>;
  }

  const editingFuse = editingBomb && editedBombFuse !== undefined;

  return (
    // The page panel already insets for the safe area.
    <View style={styles.container} onLayout={onAreaLayout}>
      {!!area && <>
        <View style={[styles.toolbar, { width: contentWidth }]}>
          <SimpleButton onPress={exit} text="Manage" icon={graphics.HAMMER_ICON} height={TOOLBAR_HEIGHT} />
          <View style={styles.toolbarGroup}>
            <ToolbarButton Svg={BackButton} label="Undo" onPress={undo} disabled={historySizes.undo === 0} />
            <ToolbarButton Svg={BackButton} flipped label="Redo" onPress={redo} disabled={historySizes.redo === 0} />
            <ToolbarButton icon={graphics.SAVE_ICON_PURPLE} label="Save" onPress={saveChanges} disabled={!unsavedChanges} badge={unsavedChanges} />
            <ToolbarButton icon={graphics.PLAY_ICON} label="Playtest" text="Playtest" onPress={playtest} main />
          </View>
        </View>

        <View style={[styles.boardArea, { height: boardSpace }]}>
          <View ref={boardRef} {...panResponder.panHandlers} onLayout={remeasure}>
            <GameBoard board={level.board} overrideTileSize={tileSize}>
              {editingFuse && <View pointerEvents="none" style={[styles.tileHighlight, {
                left: editingBomb.x * tileSize,
                top: editingBomb.y * tileSize,
                width: tileSize,
                height: tileSize,
              }]} />}
            </GameBoard>
          </View>
        </View>

        {/* Edge to edge, with the first and last tools lined up with the board. */}
        <ToolStrip selected={toolLabel} options={toolOptions} onSelect={selectTool} width={area.width} inset={(area.width - contentWidth) / 2} />
        <View style={styles.optionsArea}>
          {editingFuse ?
            <PlacedBombRow fuse={editedBombFuse} setFuse={setPlacedFuse} onDone={() => setEditingBomb(undefined)} width={contentWidth} /> :
            <ToolOptionsRow selected={toolLabel} options={toolOptions} setOptions={updateToolOptions} width={contentWidth} />}
        </View>
      </>}
    </View>
  );
}

interface ToolbarButtonProps {
  icon?: ImageSourcePropType,
  Svg?: typeof BackButton,
  flipped?: boolean, // Mirrors the Svg.
  label: string, // For accessibility.
  text?: string, // Shown next to the icon.
  onPress: () => void,
  disabled?: boolean,
  main?: boolean,
  badge?: boolean, // A dot in the corner, e.g. unsaved changes.
}

function ToolbarButton({ icon, Svg, flipped, label, text, onPress, disabled, main, badge }: ToolbarButtonProps) {
  const { darkMode } = useContext(GlobalContext);
  return (
    <ResponsivePressable
      onPress={onPress}
      disabled={disabled}
      pressedSize={0.92}
      accessibilityLabel={label}
      customStyle={[styles.toolbarButton, text ? styles.toolbarButtonWithText : {}, {
        borderColor: purpleTheme.MAIN_COLOR,
        backgroundColor: main ? purpleTheme.MAIN_COLOR : (darkMode ? purpleTheme.NEAR_BLACK : purpleTheme.OFF_WHITE),
      }]}
      pressedStyle={{ backgroundColor: purpleTheme.MAIN_TRANSPARENT(main ? 0.8 : 0.3) }}
    >
      <View style={styles.toolbarButtonContent}>
        {icon && <Image source={icon} style={styles.toolbarIcon} />}
        {Svg && <Svg width={TOOLBAR_ICON} height={TOOLBAR_ICON} fillColor={purpleTheme.MAIN_COLOR} flipped={flipped} />}
        {!!text && <Text allowFontScaling={false} style={[styles.toolbarText, { color: main ? "#fff" : purpleTheme.MAIN_COLOR }]}>{text}</Text>}
      </View>
      {badge && <View style={[styles.badge, { borderColor: darkMode ? purpleTheme.NEAR_BLACK : purpleTheme.OFF_WHITE }]} />}
    </ResponsivePressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    paddingVertical: GAP, // Android has no inset above the toolbar.
  },
  toolbar: {
    height: TOOLBAR_HEIGHT,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: normalize(8), // Same spacing as between the buttons in the group.
  },
  toolbarGroup: {
    flexDirection: "row",
    gap: normalize(8),
  },
  toolbarButton: {
    width: TOOLBAR_HEIGHT,
    height: TOOLBAR_HEIGHT,
    borderRadius: normalize(10),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarButtonWithText: {
    width: undefined,
    paddingLeft: normalize(6),
    paddingRight: normalize(12),
  },
  toolbarButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolbarIcon: {
    width: TOOLBAR_ICON,
    height: TOOLBAR_ICON,
  },
  toolbarText: {
    marginLeft: normalize(4),
    fontSize: normalize(15),
    fontFamily: "Montserrat-Regular",
  },
  badge: {
    position: "absolute",
    top: -normalize(4),
    right: -normalize(4),
    width: normalize(12),
    height: normalize(12),
    borderRadius: normalize(6),
    borderWidth: 2,
    backgroundColor: colors.RED_THEME.MAIN_COLOR,
  },
  boardArea: {
    justifyContent: "center",
    marginVertical: GAP,
  },
  optionsArea: {
    marginTop: GAP,
  },
  tileHighlight: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 4,
    borderColor: colors.RED_THEME.MAIN_COLOR,
  },
});
