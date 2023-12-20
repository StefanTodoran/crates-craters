import { View, Text, StyleSheet } from "react-native";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { Level, createBlankBoard } from "../util/types";
import { useContext, useState } from "react";
import GlobalContext from "../GlobalContext";
import InputLine from "../components/InputLine";
import MenuButton from "../components/MenuButton";
import { eventEmitter } from "../util/events";

interface Props {
  createLevelCallback: (newLevel: Level) => void,
}

export default function CreateLevel({ createLevelCallback }: Props) {
  const { darkMode } = useContext(GlobalContext);

  const [levelName, setLevelName] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();
  // const nameTaken = levels.some(lvl => lvl.name === levelName);

  return (
    <>
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
          disabled={!levelName || !levelDesigner}
          // disabled={!levelName || !levelDesigner || nameTaken}

          onPress={() => {
            createLevelCallback({
              name: levelName,
              uuid: new Date().getTime().toString(),
              board: createBlankBoard(),
              completed: false,
              official: false,
              designer: levelDesigner,
              created: levelCreated,
            });
            
            eventEmitter.emit("doPageChange", { detail: 0 });
          }}
        />
      </View>
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