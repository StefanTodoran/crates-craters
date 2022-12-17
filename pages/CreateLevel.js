import { View, StyleSheet, Dimensions, Animated, Image, Text } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';

import { cloneBoard, getSpawnPos, createLevelObj, identifier, levels, importStoredLevels } from '../Game';
import { colors, graphics } from '../Theme';
import InputLine from '../components/InputLine';
const win = Dimensions.get('window');

export default function CreateLevel({ pageCallback, levelCallback, level, storeLevelCallback, darkMode }) {
  useEffect(() => {
    // If there is already a level object we wish to continue editing it. We have to wrap
    // this in a useEffect so we don't update the parent state in the middle of a render.
    // We don't just have parent create the blank level since we want to abstract that away from App.js

    if (level === null) {
      storeLevelCallback(createLevelObj("", "", null))
    }
  });

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
    if (currentTool === "spawn") {
      const spawnPos = getSpawnPos(level.board);
      if (!(isNaN(spawnPos.y) || isNaN(spawnPos.x))) {
        newBoard[spawnPos.y][spawnPos.x] = 0;
      }
      playSuccessSound();
    }
    if (type === "empty") {
      newBoard[y][x] = identifier[currentTool];
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
    pageCallback("play_level");
  }

  // ==================
  // LOCAL DATA STORAGE
  // ==================
  async function storeData(value, storage_key) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storage_key, jsonValue);
    } catch (err) {
      console.log("\n\n(ERROR) >>> SAVING ERROR:\n", err);
    }
  }

  // Local Data Reading
  async function getData(storage_key) {
    try {
      const jsonValue = await AsyncStorage.getItem(storage_key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (err) {
      console.log("\n\n(ERROR) >>> READING ERROR:\n", err);
    }
  }

  const saveLevelToStorage = async () => {
    if (level.name === "") {
      return;
    }
    await storeData(level, level.name);
    await importStoredLevels(); // Causes Game.js module to register the change
    updateIndex();
  }

  const loadLevelFromStorage = async () => {

  }

  const deleteLevelFromStorage = async () => {

  }

  return (
    <View style={styles.container}>
      {level && <GameBoard board={level.board} tileCallback={changeTile}></GameBoard>}

      {/* TOOLS MODAL */}
      {toolsModalOpen && <Animated.View style={{
        ...styles.modal,
        opacity: fadeToolsAnim,
        backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
      }}>
        <Image style={styles.toolsBanner} source={graphics.TOOLS_BANNER} />
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="crate" label="Crate" icon={graphics.CRATE} width={win.width / 3} />
          <MenuButton onPress={changeTool} value="crater" label="Crater" icon={graphics.CRATER} width={win.width / 3} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="door" label="Door" icon={graphics.DOOR} width={win.width / 3} />
          <MenuButton onPress={changeTool} value="key" label="Key" icon={graphics.KEY} width={win.width / 3} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="flag" label="Flag" icon={graphics.FLAG} width={win.width / 3} />
          <MenuButton onPress={changeTool} value="coin" label="Coin" icon={graphics.COIN} width={win.width / 3} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={changeTool} value="wall" label="Wall" icon={graphics.WALL_ICON} width={win.width / 3} />
          <MenuButton onPress={changeTool} value="spawn" label="Player" icon={graphics.PLAYER} width={win.width / 3} />
        </View>
        <MenuButton onLongPress={storeLevelCallback} value={null} label="Clear Level (Long Press)" icon={graphics.HAMMER_ICON} width={2 * win.width / 3}/>
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
          <MenuButton onPress={testLevel} value={null} label="Playtest" icon={graphics.PLAYER} width={win.width / 3} disabled={index === -1} />
          <MenuButton onPress={saveLevelToStorage} value={null} label="Save Level" icon={graphics.SAVE_ICON} width={win.width / 3} disabled={level.name === ""} />
        </View>
        <View style={styles.row}>
          <MenuButton onPress={loadLevelFromStorage} value={null} label="Load Level" icon={graphics.LOAD_ICON} width={win.width / 3} disabled={level.name === ""} />
          <MenuButton onPress={deleteLevelFromStorage} value={null} label="Delete Level" icon={graphics.DELETE_ICON} width={win.width / 3} disabled={index === -1} />
        </View>
        <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={graphics.DOOR} />
      </Animated.View>}
      {/* END OPTIONS MODAL */}

      <View style={styles.buttonsRow(darkMode)}>
        <MenuButton onPress={toggleToolsModal} value={null} label="Tools" icon={graphics.HAMMER_ICON} width={win.width / 3} disabled={optionsModalOpen} />
        <MenuButton onPress={toggleOptionsModal} value={null} label="Options" icon={graphics.OPTIONS_ICON} width={win.width / 3} disabled={toolsModalOpen} />
      </View>
    </View>
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
    paddingTop: win.height * 0.05,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  buttonsRow: (darkMode) => ({
    position: "absolute",
    bottom: 0,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    borderTopColor: colors.MAIN_COLOR,
    borderTopWidth: 1,
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
    width: sizeFromWidthPercent(0.45, 141, 288)[0],
    height: sizeFromWidthPercent(0.45, 141, 288)[1],
  },
  optionsBanner: {
    width: sizeFromWidthPercent(0.65, 145, 365)[0],
    height: sizeFromWidthPercent(0.65, 145, 365)[1],
  },
});