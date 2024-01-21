import { useContext, useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text } from "react-native";
import { PageView, UserLevel } from "../util/types";
import { calcPreviewTileSize } from "../util/board";
import { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { colors } from "../Theme";

import SubpageContainer from "../components/SubpageContainer";
import BoardPreview from "../components/BoardPreview";
import InputCard from "../components/InputCard";

const win = Dimensions.get("window");

interface Props {
  // level: Level,
  level: UserLevel,
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
}

export default function ManageLevel({
  level,
  viewCallback,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  const [levelTitle, setLevelTitle] = useState<string>("");
  const [levelDesigner, setLevelDesigner] = useState<string>("");

  useEffect(() => {
    if (!level) return;

    setLevelTitle(level.name);
    setLevelDesigner(level.designer);
  }, [level]);

  // TODO: either add a save changes button or update automatically in the event of unmount

  const previewWidth = 0.9;
  const tileSize = calcPreviewTileSize(level.board[0].length, previewWidth, win);
  const [previewPressed, setPreviewPressed] = useState(false);

  return (
    <SubpageContainer center>
      <InputCard
        title={level.name}
        hints={[`Created ${new Date(level.created).toDateString()}`, level.uuid]}
        fields={[
          {
            label: "Level Title",
            value: levelTitle,
            update: setLevelTitle
          },
          {
            label: "Designer Name",
            value: levelDesigner,
            update: setLevelDesigner
          },
        ]}
        buttonText="Save"
        buttonCallback={() => {}}
        buttonDisabled={levelTitle === level.name && levelDesigner === level.designer}
      />

      <Pressable
        style={{
          position: "relative",
          transform: [{ scale: previewPressed ? 0.99 : 1 }],
        }}
        onPress={() => viewCallback(PageView.EDITOR)}
        onPressIn={() => setPreviewPressed(true)}
        onPressOut={() => setPreviewPressed(false)}
      >
        <BoardPreview level={level} previewSize={3} previewWidth={previewWidth} />
        <Text style={[
          styles.previewOverlay,
          {
            borderRadius: tileSize / 5, // Same value as GameBoard borderRadius.
            backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.45) : colors.NEAR_BLACK_TRANSPARENT(0.45),
            color: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE,
          }
        ]}>Edit Board</Text>
      </Pressable>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: normalize(32),
    letterSpacing: 1,
  },
});