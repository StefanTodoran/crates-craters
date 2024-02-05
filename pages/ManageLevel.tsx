import { useContext, useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { PageView, UserLevel } from "../util/types";
import { calcPreviewTileSize } from "../util/board";
import { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { colors, graphics } from "../Theme";

import SubpageContainer from "../components/SubpageContainer";
import BoardPreview from "../components/BoardPreview";
import InputCard from "../components/InputCard";
import MenuButton from "../components/MenuButton";
import { deleteLevel, updateLevel } from "../util/loader";
// import { compressBoardData } from "../util/loader";
import { eventEmitter } from "../util/events";
import { useForceRefresh } from "../util/hooks";

const win = Dimensions.get("window");

const deleteLevelText = `Delete Level 
(Long Press)`;

interface Props {
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
  const [refreshed, forceRefresh] = useForceRefresh();

  useEffect(() => {
    if (!level) return;

    setLevelTitle(level.name);
    setLevelDesigner(level.designer);
  }, [level, refreshed]);
  // console.log(compressBoardData(level.board));
  
  const previewWidth = 0.9;
  const tileSize = level ? calcPreviewTileSize(level.board[0].length, previewWidth, win) : undefined;
  const [previewPressed, setPreviewPressed] = useState(false);  

  if (!level) return;
  return (
    <SubpageContainer center>
      <View style={{
        marginTop: normalize(60),
        marginBottom: normalize(50),
      }}>
        <InputCard
          title={level.name}
          hints={[`Created ${new Date(level.created).toDateString()}`]}
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
          buttonCallback={() => {
            // @ts-expect-error We just want to update these two properties, which both exist on UserLevel.
            updateLevel({ uuid: level.uuid, name: levelTitle, designer: levelDesigner});
            forceRefresh();
          }}
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
              // @ts-expect-error No, it is not possibly undefined.
              borderRadius: tileSize / 5, // Same value as GameBoard borderRadius.
              backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.45) : colors.NEAR_BLACK_TRANSPARENT(0.45),
              color: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE,
            }
          ]}>Edit Board</Text>
        </Pressable>

        <View style={styles.singleButton}>
          <MenuButton
            onPress={() => { }}
            label="Share Online"
            icon={graphics.LOAD_ICON}
            theme={colors.GREEN_THEME}
            disabled
          />
        </View>
        <View style={styles.singleButton}>
          <MenuButton
            onLongPress={() => {
              deleteLevel(level);
              eventEmitter.emit("doPageChange", { detail: 0 });
            }}
            icon={graphics.DELETE_ICON}
            theme={colors.RED_THEME}
            label={deleteLevelText}
            allowOverflow
          />
        </View>
      </View>
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
  singleButton: {
    paddingHorizontal: "22.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});