import { View, StyleSheet, Dimensions, Animated, Image, Text, Keyboard, Platform, StatusBar, SafeAreaView } from 'react-native';
import React, { useState, useRef, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';

import { cloneBoard, getSpawnPos, createLevelObj, identifier, levels, importStoredLevels, formatTileEntityData, storeData, getData, cloneLevelObj } from '../Game';
import { colors, graphics } from '../Theme';
import InputLine from '../components/InputLine';
import { GlobalContext } from '../GlobalContext';
import SliderBar from '../components/SliderBar';
import { ScrollView } from 'react-native';
import SimpleButton from '../components/SimpleButton';
import { normalize } from '../TextStyles';
const win = Dimensions.get('window');

/**
 * @param {Function} viewCallback
 * Takes a string and sets the current application view.
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
 *   "created": string,
 *   "completed": boolean,
 * }
 * 
 * @param {Function} storeLevelCallback
 * Callback used to update the above level object.
 */
export default function CreateLevel({ viewCallback, levelCallback, levelIndex, levelObj, storeLevelCallback, playTestCallback }) {
  const { darkMode } = useContext(GlobalContext);

  // useEffect(() => {
  //   // If there is already a level object we wish to continue editing it. We have to wrap
  //   // this in a useEffect so we don't update the parent state in the middle of a render.
  //   // We don't just have parent create the blank level since we want to abstract that away from App.js

  //   if (!levelObj) {
  //     storeLevelCallback(cloneLevelObj(levelIndex));
  //   }
  // }, [levelIndex, levelObj]);

  const special = levelObj.designer === "special";
  const [levelName, setLevelName] = useState(levelObj.name);
  const [levelDesigner, setLevelDesigner] = useState("");

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
  const [toolsModalOpen, setToolsModalState] = useState(special);

  const fadeToolsAnim = useRef(new Animated.Value(special ? 1 : 0)).current;
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

  function changeTile(y, x, type) {
    const newBoard = cloneBoard(levelObj.board);

    // Clear current spawn position, if it exists. We
    // cannot allow multiple spawn locations!
    if (currentTool === "spawn") {
      const spawnPos = getSpawnPos(levelObj.board);
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
      name: levelObj.name,
      designer: levelObj.designer,
      created: levelObj.created,
      board: newBoard,
    });
  }

  function changeTool(tool) {
    selectTool(tool);
    toggleToolsModal();
  }

  function testLevel() {
    levelCallback(levelIndex);
    playTestCallback();
  }

  const validNameAndDesigner = (levelDesigner !== "default" && levelDesigner !== "special" && levelDesigner !== "" && levelName !== "");

  function isNameTaken() {
    return false;
  }

  function createNewLevel() {
    //
  }

  // ==================
  // LOCAL DATA STORAGE
  // ==================
  async function saveLevelToStorage() {
    if (levelObj.designer === "special" || levelObj.designer === "default") {
      return;
    }

    await storeData(levelObj, levelObj.name);
    await importStoredLevels(); // Causes Game.js module to register the change

    const board = levelObj.board;
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

  async function deleteLevelFromStorage() {
    if (levelObj.designer === "special" || levelObj.designer === "default") {
      return;
    }

    await AsyncStorage.removeItem(levelObj.name);
    await importStoredLevels();

    // A bit of a hack, this clears the parent's game state, so if there
    // was a game in progress on the level being deleted, it gets cleared.
    levelCallback(-1);
  }
  // ================
  // END DATA STORAGE
  // ================

  const [fuseTimer, setFuseTimer] = useState(15);
  return (
    <SafeAreaView style={styles.container}>
      {special && <>
      <Image style={styles.optionsBanner} source={graphics.OPTIONS_BANNER} />
      <View style={styles.inputContainer()}>
        <InputLine label={"Level Name"} value={levelName} changeCallback={setLevelName} darkMode={darkMode} />
        <InputLine label={"Designer"} value={levelDesigner} changeCallback={setLevelDesigner} darkMode={darkMode} />
        <Text style={styles.text()}>
          Created {levelObj.created}
        </Text>
      </View>
      <View style={styles.singleButton}>
        <MenuButton onPress={createNewLevel} label="Create Level" icon={graphics.SAVE_ICON} disabled={!validNameAndDesigner || isNameTaken()}/>
      </View>
      <View style={styles.singleButton}>
        <MenuButton onPress={() => { viewCallback("home"); }} label="Back to Menu" icon={graphics.DOOR} />
      </View>
      </>}

      {!special && <>
        {levelObj && <GameBoard board={levelObj.board} tileCallback={changeTile}></GameBoard>}

        {/* START MODAL */}
        {toolsModalOpen && <Animated.View style={{
          ...styles.modal,
          opacity: fadeToolsAnim,
          backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.85) : "rgba(255, 255, 255, 0.85)",
        }}>
          <ScrollView overScrollMode="never" style={{ width: "100%" }}>

            <View style={styles.section}>
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
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="one_way_left" label="Left" icon={graphics.ONE_WAY_LEFT} />
                <MenuButton onPress={changeTool} value="one_way_right" label="Right" icon={graphics.ONE_WAY_RIGHT} />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="one_way_up" label="Up" icon={graphics.ONE_WAY_UP} />
                <MenuButton onPress={changeTool} value="one_way_down" label="Down" icon={graphics.ONE_WAY_DOWN} />
              </View>
              <View style={{ height: 15 }} />
              <View style={styles.row}>
                <SliderBar label="Fuse Timer" value={fuseTimer} units={" turns"}
                  minValue={1} maxValue={100} changeCallback={setFuseTimer} darkMode={darkMode} />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="bomb" label="Bomb" icon={graphics.BOMB} />
              </View>
            </View>

            <View style={styles.section}>
              <Image style={styles.optionsBanner} source={graphics.OPTIONS_BANNER} />
              <View style={styles.row}>
                <MenuButton onLongPress={deleteLevelFromStorage} label="Delete Level     (Long Press)" icon={graphics.DELETE_ICON} allowOverflow />
                <MenuButton onLongPress={() => { storeLevelCallback(createLevelObj("", "", null)); }} label="Clear Level      (Long Press)" icon={graphics.HAMMER_ICON} allowOverflow />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={testLevel} label="Playtest" icon={graphics.PLAYER} />
                <MenuButton onPress={saveLevelToStorage} label="Save Level" icon={graphics.SAVE_ICON} />
              </View>
            </View>

          </ScrollView>
        </Animated.View>}
        {/* END MODAL */}

        <View style={styles.buttonsRow}>
          <SimpleButton onPress={() => { toggleToolsModal(); }} text="Tools & Options" />
          <View style={{ width: normalize(15) }} />
          <SimpleButton onPress={() => {
            saveLevelToStorage();
            viewCallback("home");
          }} text="Save & Exit" />
        </View>
      </>}
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
    paddingTop: StatusBar.currentHeight + 15,
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "100%",
  },
  section: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: normalize(50),
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: normalize(63), // height of buttonsRow, except slightly less for some reason?
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.MAIN_COLOR_TRANSPARENT(0.3),
    alignItems: "center",
    justifyContent: "center",
  },
  text: () => ({
    marginTop: 5,
    marginBottom: 15,
    color: colors.MAIN_COLOR_TRANSPARENT(0.8),
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  inputContainer: () => ({
    position: "relative",
    width: 4 * win.width / 5,
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