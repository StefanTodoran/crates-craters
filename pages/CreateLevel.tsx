import { useContext, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import InputLine, { INPUT_FIELD_HEIGHT, INPUT_LABEL_ROOM } from "../components/InputLine";
import SimpleButton from "../components/SimpleButton";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";
import { createBlankBoard } from "../util/board";
import { generateUUID } from "../util/loader";
import { requestSubpage } from "../util/store";
import { UserLevel } from "../util/types";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
  existingLevelNames: string[],
}

/** The header of the editor's level list: name a new level, then create it. */
export default function CreateLevel({ createLevelCallback, existingLevelNames }: Props) {
  const { darkMode, userData, userCredential } = useContext(GlobalContext);
  const win = useWindowDimensions();

  const [levelTitle, setLevelTitle] = useState("");
  const duplicate = existingLevelNames.includes(levelTitle.trim().toLowerCase());
  const canCreate = !!levelTitle.trim() && !duplicate && !!userCredential;

  let hint = "Name your level to get started. You can rename it later.";
  if (!userCredential) hint = "Log in to start creating levels.";
  else if (duplicate) hint = "You already have a level with this name.";

  function create() {
    createLevelCallback({
      name: levelTitle.trim(),
      uuid: generateUUID(),
      board: createBlankBoard(),
      completed: false,
      official: false,
      created: new Date().toISOString(),
      user_name: userData!.user_name,
    });
    setLevelTitle("");
    requestSubpage(1);
  }

  const count = existingLevelNames.length;
  const textColor = darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR;

  return (
    <View style={[styles.container, { width: win.width, paddingHorizontal: win.width * 0.05 }]}>
      <Text style={[styles.heading, { color: textColor }]}>New Level</Text>

      <View style={styles.row}>
        <InputLine
          label="Level title"
          value={levelTitle}
          onChange={setLevelTitle}
          darkMode={darkMode}
          disabled={!userCredential}
          doFlex
        />
        {/* Matches the field's room for its raised label, so the button centers on the outline. */}
        <View style={{ marginTop: INPUT_LABEL_ROOM }}>
          <SimpleButton
            text="Create"
            onPress={create}
            disabled={!canCreate}
            theme={colors.RED_THEME}
            extraMargin={[10, 0, 0, 0]}
            height={INPUT_FIELD_HEIGHT}
            main
          />
        </View>
      </View>

      <Text style={[styles.hint, duplicate && { color: colors.RED_THEME.TINT_COLOR }]}>{hint}</Text>

      {count > 0 && <Text style={styles.sectionLabel}>
        {count === 1 ? "1 level" : `${count} levels`}
      </Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: normalize(4),
    paddingBottom: normalize(8),
  },
  heading: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(22),
    marginBottom: normalize(6),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  hint: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(13),
    color: colors.DIM_GRAY,
    marginTop: normalize(8),
  },
  sectionLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: normalize(12),
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.DIM_GRAY,
    marginTop: normalize(20),
  },
});
