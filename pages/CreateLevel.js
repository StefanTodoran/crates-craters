import { View, StyleSheet, Dimensions, Animated, Image, Text, Keyboard, Platform, StatusBar, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';

import { cloneBoard, getSpawnPos, createLevelObj, identifier, levels, importStoredLevels, formatTileEntityData } from '../Game';
import { colors, graphics } from '../Theme';
import InputLine from '../components/InputLine';
import { GlobalContext } from '../GlobalContext';
import SliderBar from '../components/SliderBar';
const win = Dimensions.get('window');

/**
 * @param {Function} pageCallback
 * Takes a string and sets the page state in the parent.
 * 
 * @param {Function} levelCallback
 * Takes an integer and sets the level in the parent. Also clears parent's game state.
 * 
 * @param {Object} level
 * An object representing the current level being edited. Same format as data stored in AsyncStorage.
 * {
 *   "name": string,
 *   "designer": string,
 *   "board": number[][],
 * }
 * 
 * @param {Function} storeLevelCallback
 * Callback used to update the above level object.
 */
export default function CreateLevel({ pageCallback, levelCallback, level, storeLevelCallback, playTestCallback }) {
  const { darkMode, dragSensitivity } = useContext(GlobalContext);
  const [keyboardShown, setKeyboardShown] = useState(true);
  const [fuseTimer, setFuseTimer] = useState(15);

  useEffect(() => {
    // If there is already a level object we wish to continue editing it. We have to wrap
    // this in a useEffect so we don't update the parent state in the middle of a render.
    // We don't just have parent create the blank level since we want to abstract that away from App.js

    if (!level) {
      storeLevelCallback(createLevelObj("", "", null));
    }
  }, [level]);

  // ===================
  // SOUND RELATED SETUP
  // ===================
  const [successSound, setSuccessSound] = useState();
  const [errorSound, setErrorSound] = useState();

  async function playSuccessSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/move.wav'));
    setSuccessSound(sound);
    await sound.playAsync();
  }
  async function playErrorSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/badmove.wav'));
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

  const [currentTool, selectTool] = useState("wall");

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
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      if (modalWasOpen) {
        setToolsModalState(false);
      }
    });
  }

  const [optionsModalOpen, setOptionsModalState] = useState(false);
  const fadeOptionsAnim = useRef(new Animated.Value(0)).current;
  function toggleOptionsModal() {
    const start = (optionsModalOpen) ? 1 : 0;
    const end = (optionsModalOpen) ? 0 : 1;
    const modalWasOpen = optionsModalOpen;
    if (!modalWasOpen) { // If modal was not open
      setOptionsModalState(true); // Set modal to open
    }
    fadeOptionsAnim.setValue(start);
    Animated.timing(fadeOptionsAnim, {
      toValue: end,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      if (modalWasOpen) {
        setOptionsModalState(false);
      }
    });
  }

  function changeTile(y, x, type) {
    const newBoard = cloneBoard(level.board);

    // Clear current spawn position, if it exists. We
    // cannot allow multiple spawn locations!
    if (currentTool === "spawn") {
      const spawnPos = getSpawnPos(level.board);
      if (!(isNaN(spawnPos.y) || isNaN(spawnPos.x))) {
        newBoard[spawnPos.y][spawnPos.x] = 0;
      }
    }

    if (type === "empty") {
      if (currentTool === "bomb") {
        // We need special handling for tile entities.
        newBoard[y][x] = formatTileEntityData({
          type: "bomb",
          fuse: fuseTimer,
        });
      } else {
        // Normal non-entity tile logic.
        newBoard[y][x] = identifier[currentTool];
      }
      playSuccessSound();
    } else {
      newBoard[y][x] = 0; // empty
      playErrorSound();
    }

    storeLevelCallback({
      name: level.name,
      designer: level.designer,
      created: level.created,
      board: newBoard,
    });
  }

  function changeTool(tool) {
    selectTool(tool);
    toggleToolsModal();
  }

  // The following functions are used for the options modal.
  function changeName(value) {
    storeLevelCallback({
      name: value,
      designer: level.designer,
      created: level.created,
      board: level.board,
    });
  }

  function changeDesigner(value) {
    storeLevelCallback({
      name: level.name,
      designer: value,
      created: level.created,
      board: level.board,
    });
  }

  const [index, setIndex] = useState(-1);
  function updateIndex() {
    const updated = (level) ? levels.findIndex(element => element.name === level.name) : -1;
    setIndex(updated);
  }
  useEffect(updateIndex, [level]);

  function testLevel() {
    levelCallback(index);
    playTestCallback();
  }

  function shareLevel() {
    levelCallback(index);
    pageCallback("share");
  }

  // ==================
  // LOCAL DATA STORAGE
  // ==================
  async function storeData(value, storage_key) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storage_key, jsonValue);
      return true;
    } catch (err) {
      console.log("\n\n(ERROR) >>> SAVING ERROR:\n", err);
      return false;
    }
  }

  // Local Data Reading
  async function getData(storage_key) {
    try {
      const jsonValue = await AsyncStorage.getItem(storage_key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (err) {
      console.log("\n\n(ERROR) >>> READING ERROR:\n", err);
      return false;
    }
  }

  async function removeData(storage_key) {
    try {
      await AsyncStorage.removeItem(storage_key);
      return true;
    }
    catch (err) {
      console.log("\n\n(ERROR) >>> REMOVING ERROR:\n", err);
      return false;
    }
  }

  const saveLevelToStorage = async () => {
    if (level.name === "") {
      return;
    }
    await storeData(level, level.name);
    await importStoredLevels(); // Causes Game.js module to register the change
    updateIndex();

    const board = level.board;
    console.log("const level = [");
    for (let i = 0; i < board.length; i++) {
      let line = "  ["
      for (let j = 0; j < board[0].length; j++) {
        line += board[i][j] + ", "
      }
      line += "],"
      console.log(line);
    }
    console.log("];");
  }

  const loadLevelFromStorage = async () => {
    const data = await getData(level.name);
    if (data) {
      storeLevelCallback(data);
    }
  }

  const deleteLevelFromStorage = async () => {
    if (level.name === "" || index === -1) {
      return false; // Fail, level isn't saved
    }
    await AsyncStorage.removeItem(level.name);
    levels.splice(index, 1);
    levelCallback(-1); // A bit of a hack, this clears the parent's game state, so if there
    // was a game in progress on the level being deleted, it gets cleared.
    setIndex(-1);
  }

  // We want to hide the modal's toolbar if the user is inputing text into
  // the level name or designer text inputs, so we need to some event listeners.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? "keyboardWillShow" : "keyboardDidShow";
    const showListener = Keyboard.addListener(showEvent, () => {
      // const showListener = Keyboard.addListener("keyboardWillShow", () => {
      setKeyboardShown(false);
    });
    const hideEvent = Platform.OS === 'ios' ? "keyboardWillHide" : "keyboardDidHide";
    const hideListener = Keyboard.addListener(hideEvent, () => {
      // const hideListener = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardShown(true);
    });

    return function cleanup() {
      showListener.remove();
      hideListener.remove();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {level && <GameBoard board={level.board} tileCallback={changeTile}></GameBoard>}

      {/* TOOLS MODAL */}
      {toolsModalOpen && <Animated.View style={{
        ...styles.modal,
        opacity: fadeToolsAnim,
        backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
      }}>
        <Image style={styles.toolsBanner} source={graphics.TOOLS_BANNER} />
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="crate" label="Crate" icon={graphics.CRATE} />
          <MenuButton onPress={changeTool} value="crater" label="Crater" icon={graphics.CRATER} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="door" label="Door" icon={graphics.DOOR} />
          <MenuButton onPress={changeTool} value="key" label="Key" icon={graphics.KEY} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="flag" label="Flag" icon={graphics.FLAG} />
          <MenuButton onPress={changeTool} value="coin" label="Coin" icon={graphics.COIN} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="wall" label="Wall" icon={graphics.WALL_ICON} />
          <MenuButton onPress={changeTool} value="spawn" label="Player" icon={graphics.PLAYER} />
        </View>
        <View style={{ height: 15 }} />
        <View style={styles.row}>
          <SliderBar label="Fuse Timer" value={fuseTimer} units={" turns"}
            minValue={1} maxValue={100} changeCallback={setFuseTimer} darkMode={darkMode} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="bomb" label="Bomb" icon={graphics.BOMB} />
        </View>
      </Animated.View>}
      {/* END TOOLS MODAL */}

      {/* OPTIONS MODAL */}
      {optionsModalOpen && <Animated.View style={{
        ...styles.modal,
        opacity: fadeOptionsAnim,
        backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
      }}>
        <Image style={styles.optionsBanner} source={graphics.OPTIONS_BANNER} />
        <View style={styles.inputContainer()}>
          <InputLine label={"Level Name"} value={level.name} changeCallback={changeName} darkMode={darkMode} />
          <InputLine label={"Designer"} value={level.designer} changeCallback={changeDesigner} darkMode={darkMode} />
          <Text style={styles.text()}>
            Created {level.created}
          </Text>
        </View>
        <View style={styles.row}>
          <MenuButton onPress={testLevel} label="Playtest" icon={graphics.PLAYER} disabled={index === -1} />
          <MenuButton onPress={saveLevelToStorage} label="Save Level" icon={graphics.SAVE_ICON} disabled={level.name === ""} />
        </View>
        <View style={styles.row}>
          <MenuButton onLongPress={deleteLevelFromStorage} label="Delete Level     (Long Press)" icon={graphics.DELETE_ICON} allowOverflow disabled={index === -1} />
          <MenuButton onLongPress={() => { storeLevelCallback(createLevelObj("", "", null)); }} label="Clear Level      (Long Press)" icon={graphics.HAMMER_ICON} allowOverflow />
        </View>
        <View style={styles.row}>
          {/* <MenuButton onPress={shareLevel} label="Share Level" icon={graphics.SHARE_ICON} disabled={index === -1} /> */}
          <MenuButton onPress={loadLevelFromStorage} label="Load Level" icon={graphics.LOAD_ICON} disabled={index === -1} />
          <MenuButton onPress={pageCallback} value={false} label="To Menu" icon={graphics.DOOR} />
        </View>
      </Animated.View>}
      {/* END OPTIONS MODAL */}

      {(keyboardShown || Platform.OS === "ios") && /* on ios they aren't pushed up by the keyboard, no need to hide */
        <View style={styles.buttonsRow(darkMode)}>
          <MenuButton onPress={toggleToolsModal} label="Tools" icon={graphics.HAMMER_ICON} disabled={optionsModalOpen} />
          <MenuButton onPress={toggleOptionsModal} label="Options" icon={graphics.OPTIONS_ICON} disabled={toolsModalOpen} />
        </View>}
    </SafeAreaView>
  );
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
    paddingTop: StatusBar.currentHeight + 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    width: win.width * 0.45,
  },
  buttonsRow: (darkMode) => ({
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    borderTopColor: colors.MAIN_COLOR,
    borderTopWidth: 1,
    width: win.width * 0.45,
  }),
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "20%",
  },
  text: () => ({
    marginTop: 5,
    marginBottom: 15,
    color: colors.DARK_WALL,
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  inputContainer: () => ({
    position: "relative",
    width: 2 * win.width / 3,
    marginBottom: 10,
    borderColor: colors.MAIN_COLOR,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  }),
  toolsBanner: {
    width: sizeFromWidthPercent(0.45, 141, 300)[0],
    height: sizeFromWidthPercent(0.45, 141, 300)[1],
  },
  optionsBanner: {
    width: sizeFromWidthPercent(0.55, 145, 365)[0],
    height: sizeFromWidthPercent(0.55, 145, 365)[1],
  },
});