import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { colors, graphics } from "../Theme";
import { eventEmitter } from "../util/events";
import { UserLevel, createBlankBoard } from "../util/types";

import InputCard from "../components/InputCard";
import MenuButton from "../components/MenuButton";
import SubpageContainer from "../components/SubpageContainer";

interface Props {
  createLevelCallback: (newLevel: UserLevel) => void,
}

export default function CreateLevel({ createLevelCallback }: Props) {

  const [levelTitle, setLevelTitle] = useState("");
  const [levelDesigner, setLevelDesigner] = useState("");
  const levelCreated = new Date();
  // const nameTaken = levels.some(lvl => lvl.name === levelTitle);

  return (
    <SubpageContainer center>
      <InputCard
        title={"Create New Level"}
        hints={[`Created ${levelCreated.toDateString()}`]}
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

      <View style={styles.singleButton}>
        <MenuButton
          label="Confirm & Create"
          icon={graphics.LOAD_ICON}
          theme={colors.GREEN_THEME}
          disabled={!levelTitle || !levelDesigner}
          // disabled={!levelTitle || !levelDesigner || nameTaken}

          onPress={() => {
            createLevelCallback({
              name: levelTitle,
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
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});