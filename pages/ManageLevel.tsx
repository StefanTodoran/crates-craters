import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Level, PageView } from "../util/types";
import { colors, graphics } from "../Theme";
import { normalize } from "../TextStyles";

import InputCard from "../components/InputCard";
import SubpageContainer from "../components/SubpageContainer";
import BoardPreview from "../components/BoardPreview";
import MenuButton from "../components/MenuButton";

interface Props {
  level: Level,
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
}

export default function ManageLevel({
  level,
  viewCallback,
}: Props) {
  const [levelTitle, setLevelTitle] = useState(level.name);
  const [levelDesigner, setLevelDesigner] = useState(level.designer || "");

  // TODO: either add a save changes button or update automatically in the event of unmount

  return (
    <SubpageContainer>
      <InputCard
        title={level.name}
        hints={[`Created ${level.created!.toDateString()}`]}
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
      />

      <BoardPreview level={level} previewSize={3} previewWidth={0.9} />

      <View style={styles.singleButton}>
        <MenuButton
          label="Edit Board"
          icon={graphics.HAMMER_ICON_RED}
          theme={colors.RED_THEME}
          onPress={() => viewCallback(PageView.EDITOR)}
        />
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: normalize(10),
  },
});