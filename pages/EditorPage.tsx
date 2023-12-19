import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, graphics } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";

import InputLine from "../components/InputLine";
import MenuButton from "../components/MenuButton";
import { EditorView, Level, PageView, createBlankBoard } from "../util/types";
import LevelSelect from "./LevelSelect";
import CreateLevel from "./EditLevel";

interface Props {
  viewCallback: (newView: PageView) => void,
  playLevelCallback: (uuid: string) => void,
  editorLevelCallback?: (uuid: string) => void,
  levels: Level[],
  playLevel: number,
  editorLevel?: string,
  elementHeight: number,
  storeElementHeightCallback: (height: number) => void,
}

export default function EditorPage({
  viewCallback,
  playLevelCallback,
  editorLevelCallback,
  levels,
  playLevel,
  editorLevel,
  elementHeight,
  storeElementHeightCallback,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [mode, setMode] = useState(EditorView.LIST);

  // LEVEL CREATION
  const [levelName, setLevelName] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();
  const nameTaken = levels.some(lvl => lvl.name === levelName);

  // LEVEL EDITOR
  const [level, setLevel] = useState<Level>();

  return (
    <>
      {mode === EditorView.LIST && <LevelSelect
        viewCallback={viewCallback}
        playLevelCallback={playLevelCallback}
        editorLevelCallback={editorLevelCallback}
        levels={levels}
        playLevel={-1}
        elementHeight={elementHeight}
        storeElementHeightCallback={storeElementHeightCallback}
        mode={PageView.EDIT}
        createLevelCallback={() => setMode(EditorView.CREATE)}
      />}

      {mode === EditorView.CREATE && <>
        <Text style={TextStyles.subtitle(darkMode, colors.DIM_GRAY)}>Create New Level</Text>
        <View style={styles.inputContainer}>
          <InputLine
            label={"Level Name"}
            value={levelName}
            onChange={setLevelName}
            darkMode={darkMode}
          />
          <InputLine
            label={"Designer"}
            value={levelDesigner}
            onChange={setLevelDesigner}
            darkMode={darkMode}
          />
          <Text style={styles.text}>
            Created {levelCreated.toDateString()}
          </Text>
        </View>
        <View style={styles.singleButton}>
          <MenuButton
            label="Confirm & Create"
            icon={graphics.LOAD_ICON}
            theme={colors.GREEN_THEME}
            disabled={!levelName || !levelDesigner || nameTaken}
            onPress={() => {
              setLevel({
                name: levelName,
                uuid: new Date().getTime().toString(),
                board: createBlankBoard(),
                completed: false,
                official: false,
                designer: levelDesigner,
                created: levelCreated,
              });
              setMode(EditorView.EDIT);
            }}
          />
        </View>
        <View style={styles.singleButton}>
          <MenuButton
            label="Cancel & Return"
            theme={colors.RED_THEME}
            icon={graphics.BOMB}
            onPress={() => setMode(EditorView.LIST)}
          />
        </View>
      </>}

      {mode === EditorView.EDIT && <CreateLevel
        viewCallback={viewCallback}
        level={level!}
        levelCallback={setLevel}
        playtestLevel={() => {}}
        storeChanges={() => {}}
      />}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    overflow: "hidden",
  },
  text: {
    marginTop: 5,
    marginBottom: 15,
    color: colors.DIM_GRAY_TRANSPARENT(0.5),
    fontSize: normalize(14),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    position: "relative",
    width: "90%",
    // width: 4 * win.width / 5,
    marginBottom: 10,
    borderColor: colors.DIM_GRAY,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: normalize(15),
    // paddingBottom: normalize(15),
  },
});