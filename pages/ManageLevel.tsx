import { Timestamp } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BoardPreview from "../components/BoardPreview";
import InputCard from "../components/InputCard";
import MenuButton from "../components/MenuButton";
import ResponsivePressable from "../components/ResponsivePressable";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { calcPreviewTileSize } from "../util/board";
import { UserLevelDocument, createDocument } from "../util/database";
import { doPageChange } from "../util/events";
import { useForceRefresh } from "../util/hooks";
import { compressBoardData, deleteLevel, updateLevel } from "../util/loader";
import { PageView, UserLevel } from "../util/types";

const win = Dimensions.get("window");

const deleteLevelText = `Delete Level 
(Long Press)`;

interface Props {
  level: UserLevel,
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string) => void,
}

export default function ManageLevel({
  level,
  viewCallback,
  playLevelCallback,
}: Props) {
  const { darkMode, userCredential } = useContext(GlobalContext);

  const [levelTitle, setLevelTitle] = useState<string>("");
  const [levelDesigner, setLevelDesigner] = useState<string>("");
  const [refreshed, forceRefresh] = useForceRefresh();

  useEffect(() => {
    if (!level) return;

    setLevelTitle(level.name);
    setLevelDesigner(level.designer);
  }, [level, refreshed]);

  const previewWidth = 0.9;
  const tileSize = level ? calcPreviewTileSize(level.board.width, previewWidth, win) : undefined;

  let hint;
  if (!userCredential) hint = "Log in to enable level sharing.";
  if (userCredential && !level.completed) hint = "Complete one level run to enable sharing.";
  if (level.shared) hint = "Congratulations! Your level is shared!";

  if (!level) return;
  return (
    <SubpageContainer center>
      <InputCard
        title={level.name}
        // TODO: Add level stats here once shared!
        hints={[
          `Created on ${new Date(level.created).toDateString()}.`,
          level.shared ? `Shared on ${new Date(level.shared).toDateString()}.` : "Not publicly shared.",
          // TODO: List the attempts, wins, and likes if shared and they are not all zero.
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
          onPress={() => {
            const userLevelDoc: UserLevelDocument = {
              name: level.name,
              board: compressBoardData(level.board),
              designer: level.designer,
              user_email: userCredential!.user.email!,
              shared: Timestamp.now(),
              attempts: 0,
              wins: 0,
              winrate: 1,
              likes: 0,
              best: level.best!, // Guaranteed to be defined since button is disabled if !level.completed
              keywords: [...level.name.toLowerCase().split(/\s+/), ...level.designer.toLowerCase().split(/\s+/)],
            };
            createDocument("userLevels", undefined, userLevelDoc);
            updateLevel({ ...level, shared: userLevelDoc.shared.toDate().toISOString() });
          }}
          label="Share Online"
          icon={graphics.SHARE_ICON}
          disabled={!level.completed || !userCredential}
        />
        <MenuButton
          onPress={() => {
            playLevelCallback(level.uuid);
            viewCallback(PageView.PLAY);
          }}
          label="Playtest Level"
          icon={graphics.PLAYER}
        />
      </View>
      <View style={styles.buttonsRow}>
        <MenuButton
          onLongPress={() => {
            // TODO: Unpublish the level, maybe add a confirmation screen if they have likes?
            deleteLevel(level);
            doPageChange(0);
            Toast.show({
              type: "success",
              text1: "Level deletion completed.",
              text2: `"${level.name}" has been successfully deleted.`,
            });
          }}
          disabled={!!level.shared}
          icon={graphics.DELETE_ICON}
          theme={colors.RED_THEME}
          label={deleteLevelText}
          allowOverflow
        />
        <MenuButton
          onPress={() => { }}
          icon={graphics.OPTIONS_ICON}
          theme={colors.RED_THEME}
          label={"Unshare Level"}
          // disabled={!level.shared}
          disabled
        />
      </View>

      <View style={styles.hintWrap}>
        <Text style={TextStyles.paragraph(darkMode)}>{hint}</Text>
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
    marginBottom: normalize(12),
  },
  hintWrap: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: normalize(12),
  }
});