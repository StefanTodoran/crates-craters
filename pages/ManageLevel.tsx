import { useContext, useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import { doPageChange } from "../util/events";
import { useForceRefresh } from "../util/hooks";
import { PageView, UserLevel } from "../util/types";
import { calcPreviewTileSize } from "../util/board";

import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";

// import { compressBoardData } from "../util/loader";
import { deleteLevel, updateLevel } from "../util/loader";

import Toast from "react-native-toast-message";
import InputCard from "../components/InputCard";
import MenuButton from "../components/MenuButton";
import BoardPreview from "../components/BoardPreview";
import SubpageContainer from "../components/SubpageContainer";
import ResponsivePressable from "../components/ResponsivePressable";

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
  const tileSize = level ? calcPreviewTileSize(level.board.width, previewWidth, win) : undefined;

  if (!level) return;
  return (
    <SubpageContainer center>
      <View style={styles.continer}>
        <InputCard
          title={level.name}
          // TODO: Add level stats here once shared!
          hints={[
            `Created on ${new Date(level.created).toDateString()}.`,
            "Not publicly shared."
          ]}
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
            updateLevel({ uuid: level.uuid, name: levelTitle, designer: levelDesigner });
            forceRefresh();
          }}
          buttonDisabled={levelTitle === level.name && levelDesigner === level.designer}
        />

        <ResponsivePressable
          onPress={() => viewCallback(PageView.EDITOR)}
          customStyle={styles.relative}
          pressedSize={0.99}
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
        </ResponsivePressable>

        <View style={styles.buttonsRow}>
          <MenuButton
            onPress={() => { }}
            label="Share Online"
            icon={graphics.LOAD_ICON}
            theme={colors.GREEN_THEME}
            // disabled={!level.completed}
            disabled
          />
          <MenuButton
            onLongPress={() => {
              deleteLevel(level);
              doPageChange(0);
              Toast.show({
                type: "success",
                text1: "Level deletion completed.",
                text2: `"${level.name}" has been successfully deleted.`,
              });
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
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    textTransform: "uppercase",
    fontSize: normalize(32),
    letterSpacing: 1,
  },
  buttonsRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  relative: {
    position: "relative",
  },
  continer: {
    marginTop: normalize(12),
    marginBottom: normalize(36),
  },
});