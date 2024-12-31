import { Timestamp } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BoardPreview from "../components/BoardPreview";
import InputCard from "../components/InputCard";
import ResponsivePressable from "../components/ResponsivePressable";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { calcPreviewTileSize } from "../util/board";
import { UserLevelDocument, createDocument, updateDocument } from "../util/database";
import { doPageChange } from "../util/events";
import { useForceRefresh } from "../util/hooks";
import { compressBoardData, deleteLevel, updateLevel } from "../util/loader";
import { PageView, UserLevel } from "../util/types";

const win = Dimensions.get("window");

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
  const { darkMode, userData, userCredential } = useContext(GlobalContext);

  const [levelTitle, setLevelTitle] = useState<string>("");
  const [refreshed, forceRefresh] = useForceRefresh();

  useEffect(() => {
    if (!level) return;
    setLevelTitle(level.name);
  }, [level, refreshed]);

  const previewWidth = 0.9;
  const tileSize = level ? calcPreviewTileSize(level.board.width, previewWidth, win) : undefined;

  let hint;
  if (!userCredential) hint = "Log in to enable level sharing.";
  if (userCredential && !userCredential.user.emailVerified) hint = "Verify your email to enable level sharing.";
  if (userCredential && !level?.completed) hint = "Complete one level run to enable sharing.";
  if (level?.shared) hint = "Congratulations! Your level is public!";

  function unshareLevel() {
    updateDocument("userLevels", level.db_id!, {
      public: false,
      user_email: userCredential!.user.email!,
    })
      .then(() => {
        updateLevel({ ...level, shared: undefined }, false);
      })
      .catch(error => {
        Toast.show({
          type: "error",
          text1: "Level unsharing failed.",
          text2: `Error code: ${error.code}. Please try again.`,
        });
      });
  }

  function handleDeleteLevel() {
    deleteLevel(level);
    doPageChange(0);
    Toast.show({
      type: "success",
      text1: "Level deletion completed.",
      text2: `"${level.name}" has been successfully deleted.`,
    });
  }

  if (!level) return;
  return (
    <SubpageContainer center lessTopPad>
      <InputCard
        title={level.name}
        hints={[
          `Created ${new Date(level.created).toDateString()}.`,
          level.shared ? `Shared since ${new Date(level.shared).toDateString()}.` : "Not publicly shared.",
          level.bestSolution ? `Best solution: ${level.bestSolution.length} moves.` : "Not yet solved.",
          // TODO: List the attempts, wins, and likes if shared and they are not all zero.
        ]}
        fields={[
          {
            label: "Level Title",
            value: levelTitle,
            onChange: setLevelTitle
          },
        ]}
        buttonText="Save"
        buttonCallback={() => {
          // @ts-expect-error We just want to update these two properties, which both exist on UserLevel.
          updateLevel({ uuid: level.uuid, name: levelTitle }, false);
          forceRefresh();
        }}
        buttonDisabled={levelTitle === level.name}
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

      <View style={{ marginTop: normalize(10) }} />
      <View style={styles.buttonsRow}>
        <SimpleButton
          onPress={() => {
            playLevelCallback(level.uuid);
            viewCallback(PageView.PLAY);
          }}
          text="Playtest Level"
          icon={graphics.PLAY_ICON}
          fillWidth
          extraMargin
          square
          main
        />
        <SimpleButton
          onPress={() => { }}
          text="View Solution"
          icon={graphics.KEY}
          theme={colors.GREEN_THEME}
          // TODO: Implement a solution viewer.
          // disabled={!level.bestSolution}
          disabled
          fillWidth
          extraMargin
          square
        />
      </View>

      <View style={styles.buttonsRow}>
        {level.shared ?
          <SimpleButton
            doConfirmation="Are you sure you want to make this level private? All likes and attempts will be lost permanently."
            onPress={unshareLevel}
            icon={graphics.OPTIONS_ICON}
            theme={colors.RED_THEME}
            text={"Make Private"}
            disabled={!userCredential}
            fillWidth
            extraMargin
            square
          />
          :
          <>
            <SimpleButton
              onPress={() => {
                const userLevelDoc: UserLevelDocument = {
                  name: level.name,
                  board: compressBoardData(level.board),
                  user_name: userData!.user_name,
                  user_email: userCredential!.user.email!,
                  shared: Timestamp.now(),
                  attempts: 0,
                  wins: 0,
                  winrate: 1,
                  likes: 0,
                  best: level.bestSolution!.length,
                  bestSolution: level.bestSolution!, // Guaranteed to be defined since button is disabled if !level.completed
                  keywords: [...level.name.toLowerCase().split(/\s+/), ...userData!.user_name.toLowerCase().split(/\s+/)],
                  public: true,
                };
                createDocument("userLevels", level.db_id, userLevelDoc)
                  .then(docRef => {
                    updateLevel({ ...level, shared: userLevelDoc.shared.toDate().toISOString(), db_id: docRef?.id }, false);
                  })
                  .catch(error => {
                    Toast.show({
                      type: "error",
                      text1: "Level sharing failed.",
                      text2: `Error code: ${error.code}. Please try again.`,
                    });
                  });
              }}
              text="Share Online"
              icon={graphics.SHARE_ICON}
              disabled={!level.completed || !userCredential || !userCredential.user.emailVerified || !!level.shared}
              fillWidth
              extraMargin
              square
            />
          </>
        }
        <SimpleButton
          doConfirmation="Are you sure you want to delete this level? This action is irreversible."
          onPress={handleDeleteLevel}
          icon={graphics.DELETE_ICON}
          theme={colors.RED_THEME}
          text={"Delete Level"}
          fillWidth
          extraMargin
          square
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
    marginTop: normalize(5),
    flexDirection: "row",
    justifyContent: "center",
    width: win.width * 0.45,
    marginHorizontal: win.width * 0.225,
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