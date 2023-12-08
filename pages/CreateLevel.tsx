import { View, ScrollView, StyleSheet, Dimensions, Animated, Text, StatusBar, SafeAreaView } from "react-native";
import React, { useState, useRef, useEffect, useContext } from "react";
import { Sound } from "expo-av/build/Audio";
import { Audio } from "expo-av";

import SimpleButton from "../components/SimpleButton";
import MenuButton from "../components/MenuButton";
import GameBoard from "../components/GameBoard";
import SliderBar from "../components/SliderBar";
import InputLine from "../components/InputLine";

import TextStyles, { normalize, sizeFromWidthPercent } from "../TextStyles";
import { colors, graphics } from "../Theme";
import GlobalContext from "../GlobalContext";
import { BoardTile, Level, PageView, TileType } from "../util/types";
import { cloneBoard, getSpawnPosition, validTile } from "../util/logic";
const win = Dimensions.get("window");

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  level: Level, // The level currently being edited. The uuid must not change.
  levelCallback: (newState: Level) => void, // Updates the level (usually board changes).

  playtestLevel: () => void,
  storeChanges: () => void,
}

export default function CreateLevel({
  viewCallback,
  level,
  levelCallback,
  playtestLevel,
  storeChanges,
}: Props) {
  const { darkMode, playAudio, levels } = useContext(GlobalContext);

  const special = level.designer === "special"; // TODO: this no longer exists, we will need to change this
  const [levelName, setLevelName] = useState(level.name);
  const [levelDesigner, setLevelDesigner] = useState("");

  // ===================
  // SOUND RELATED SETUP
  // ===================
  const [successSound, setSuccessSound] = useState<Sound>();
  const [errorSound, setErrorSound] = useState<Sound>();

  async function playSuccessSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/push.wav'));
    setSuccessSound(sound);
    await sound.playAsync();
  }
  async function playErrorSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/fill.wav'));
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

  const [currentTool, selectTool] = useState<BoardTile>({ id: TileType.WALL});
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

  function changeTile(y: number, x: number) {
    const newBoard = cloneBoard(level.board);
    const tileType = level.board[y][x].id;
  
    // Clear current spawn position, if it exists. We
    // cannot allow multiple spawn locations!
    if (currentTool.id === TileType.SPAWN) {
      const spawnPos = getSpawnPosition(level.board);
      if (validTile(spawnPos.y, spawnPos.x, level.board)) {
        newBoard[spawnPos.y][spawnPos.x] = { id: 0 }; // Clear the old spawn position.
      }
    }
  
    if (tileType === TileType.EMPTY) {
      newBoard[y][x] = currentTool;
      if (playAudio) playSuccessSound();
    } else if (tileType !== TileType.SPAWN) { // Never allow deletion of spawn tile, only replacement to somewhere else.
      newBoard[y][x] = { id: 0 };
      if (playAudio) playErrorSound();
    }
  
    levelCallback({
      ...level,
      board: newBoard,
    });
  }

  function changeTool(tool: BoardTile) {
    selectTool(tool);
    toggleToolsModal();
  }

  const validNameAndDesigner = (levelDesigner !== "default" && levelDesigner !== "special" && levelDesigner !== "" && levelName !== "");

  function isNameTaken() {
    return levels.some(lvl => lvl.name === levelName);
  }

  async function createNewLevel() {
    // const newLevel = cloneLevelObj(levelIndex);
    // newLevel.name = levelName;
    // newLevel.designer = levelDesigner;

    // const success = await saveLevelToStorage(newLevel, levelName);
    // if (success) {
    //   editorLevelCallback(levels.findIndex(lvl => lvl.name === levelName));
    // }
  }

  const [fuseTimer, setFuseTimer] = useState(15);
  return (
    <SafeAreaView style={styles.container}>
      {special && <>
        <Text style={styles.subtitle(darkMode)}>Creation</Text>
        <View style={styles.inputContainer()}>
          <InputLine label={"Level Name"} value={levelName} changeCallback={setLevelName} darkMode={darkMode} />
          <InputLine label={"Designer"} value={levelDesigner} changeCallback={setLevelDesigner} darkMode={darkMode} />
          <Text style={styles.text()}>
            Created {levelObj.created}
          </Text>
        </View>
        <View style={styles.singleButton}>
          <MenuButton onPress={createNewLevel} label="Create Level" icon={graphics.SAVE_ICON} disabled={!validNameAndDesigner || isNameTaken()} />
        </View>
        <View style={styles.singleButton}>
          <MenuButton onPress={() => { viewCallback("home"); }} label="Go Back" icon={graphics.DOOR_ICON} />
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
              <Text style={styles.subtitle(darkMode)}>Tools</Text>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="crate" label="Crate" icon={graphics.CRATE} />
                <MenuButton onPress={changeTool} value="crater" label="Crater" icon={graphics.CRATER} />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="wall" label="Wall" icon={graphics.WALL_ICON} />
                <MenuButton onPress={changeTool} value="spawn" label="Spawn" icon={graphics.PLAYER} />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="door" label="Door" icon={graphics.DOOR}
                  borderColor={"#b8e5b9"} backgroundColor={"#fafffa"} textColor={"#9BD99D"}
                  darkModeBackgroundColor={`rgba(169, 223, 171, 0.1)`} pressedColor={`rgba(169, 223, 171, 0.3)`}
                />
                <MenuButton onPress={changeTool} value="key" label="Key" icon={graphics.KEY}
                  borderColor={"#b8e5b9"} backgroundColor={"#fafffa"} textColor={"#9BD99D"}
                  darkModeBackgroundColor={`rgba(169, 223, 171, 0.1)`} pressedColor={`rgba(169, 223, 171, 0.3)`}
                />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="flag" label="Flag" icon={graphics.FLAG}
                  borderColor={"#FFE7A8"} backgroundColor={"#FFFDF7"} textColor={"#FFE08E"}
                  darkModeBackgroundColor={`rgba(255, 231, 168, 0.1)`} pressedColor={`rgba(255, 231, 168, 0.3)`}
                />
                <MenuButton onPress={changeTool} value="coin" label="Coin" icon={graphics.COIN}
                  borderColor={"#FFE7A8"} backgroundColor={"#FFFDF7"} textColor={"#FFE08E"}
                  darkModeBackgroundColor={`rgba(255, 231, 168, 0.1)`} pressedColor={`rgba(255, 231, 168, 0.3)`}
                />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="one_way_left" label="Left" icon={graphics.ONE_WAY_LEFT}
                  borderColor={colors.MAIN_BLUE} backgroundColor={"#FBFCFF"} textColor={"#81B5FE"}
                  darkModeBackgroundColor={`rgba(129, 181, 254, 0.1)`} pressedColor={`rgba(129, 181, 254, 0.2)`}
                />
                <MenuButton onPress={changeTool} value="one_way_right" label="Right" icon={graphics.ONE_WAY_RIGHT}
                  borderColor={colors.MAIN_BLUE} backgroundColor={"#FBFCFF"} textColor={"#81B5FE"}
                  darkModeBackgroundColor={`rgba(129, 181, 254, 0.1)`} pressedColor={`rgba(129, 181, 254, 0.2)`}
                />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="one_way_up" label="Up" icon={graphics.ONE_WAY_UP}
                  borderColor={colors.MAIN_BLUE} backgroundColor={"#FBFCFF"} textColor={"#81B5FE"}
                  darkModeBackgroundColor={`rgba(129, 181, 254, 0.1)`} pressedColor={`rgba(129, 181, 254, 0.2)`}
                />
                <MenuButton onPress={changeTool} value="one_way_down" label="Down" icon={graphics.ONE_WAY_DOWN}
                  borderColor={colors.MAIN_BLUE} backgroundColor={"#FBFCFF"} textColor={"#81B5FE"}
                  darkModeBackgroundColor={`rgba(129, 181, 254, 0.1)`} pressedColor={`rgba(129, 181, 254, 0.2)`}
                />
              </View>
              <View style={{ height: 15 }} />
              <View style={styles.row}>
                <SliderBar label="Fuse Timer" value={fuseTimer} units={" turns"}
                  minValue={1} maxValue={100} changeCallback={setFuseTimer}
                  mainColor={darkMode ? "#F79B9B" : "#FB6C6C"}
                  knobColor={darkMode ? "#1E0D0D" : "#FFFAFA"}
                />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={changeTool} value="bomb" label="Bomb" icon={graphics.BOMB}
                  borderColor={"#F79B9B"} backgroundColor={"#FFFAFA"} textColor={"#F97E7E"}
                  darkModeBackgroundColor={`rgba(239, 131, 131, 0.1)`} pressedColor={`rgba(239, 131, 131, 0.2)`}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.subtitle(darkMode)}>Options</Text>
              <View style={styles.row}>
                <MenuButton onLongPress={deleteLevelFromStorage} label="Delete Level     (Long Press)" icon={graphics.DELETE_ICON} allowOverflow />
                <MenuButton onLongPress={() => { storeLevelCallback(createLevelObj("", "", null)); }} label="Clear Level      (Long Press)" icon={graphics.HAMMER_ICON} allowOverflow />
              </View>
              <View style={styles.row}>
                <MenuButton onPress={testLevel} label="Playtest" icon={graphics.PLAYER} disabled={true} />
                <MenuButton onPress={() => { saveLevelToStorage(levelObj, levelObj.name) }} label="Save Level" icon={graphics.SAVE_ICON} />
              </View>
            </View>

          </ScrollView>
        </Animated.View>}
        {/* END MODAL */}

        <View style={styles.buttonsRow}>
          <SimpleButton onPress={() => { toggleToolsModal(); }} text="Tools & Options" main={true} />
          <View style={{ width: normalize(15) }} />
          <SimpleButton onPress={() => {
            saveLevelToStorage(levelObj, levelObj.name);
            viewCallback("home");
          }} text="Save & Exit" />
        </View>
      </>}
    </SafeAreaView>
  );
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
    borderColor: colors.MAIN_PURPLE_TRANSPARENT(0.3),
    alignItems: "center",
    justifyContent: "center",
  },
  text: () => ({
    marginTop: 5,
    marginBottom: 15,
    color: colors.MAIN_PURPLE_TRANSPARENT(0.8),
    fontSize: 12,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  subtitle: (darkMode) => ({
    ...TextStyles.subtitle(darkMode),
    marginTop: normalize(32),
    marginBottom: normalize(8),
  }),
  inputContainer: () => ({
    position: "relative",
    width: 4 * win.width / 5,
    marginBottom: 10,
    borderColor: colors.MAIN_PURPLE,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
  }),
  toolsBanner: {
    width: sizeFromWidthPercent(0.45, 141, 300).width,
    height: sizeFromWidthPercent(0.45, 141, 300).height,
  },
  optionsBanner: {
    width: sizeFromWidthPercent(0.55, 145, 365).width,
    height: sizeFromWidthPercent(0.55, 145, 365).height,
  },
});