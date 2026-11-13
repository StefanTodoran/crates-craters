import { Timestamp } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import BoardPreview from "../components/BoardPreview";
import InputLine, { INPUT_FIELD_HEIGHT, INPUT_LABEL_ROOM } from "../components/InputLine";
import { ListGroup, ListRow } from "../components/ListGroup";
import ResponsivePressable from "../components/ResponsivePressable";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { postSolutionData, publishUserLevel, updateDocument } from "../util/database";
import { requestSubpage, showSolution } from "../util/store";
import { useForceRefresh } from "../util/hooks";
import { deleteLevel, updateLevel } from "../util/loader";
import { PageView, UserLevel } from "../util/types";


interface Props {
  level: UserLevel,
  viewCallback: (newView: PageView, pageNum?: number) => void,
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

  let hint;
  if (!userCredential) hint = "Log in to enable level sharing.";
  if (userCredential && !userCredential.user.emailVerified) hint = "Verify your email to enable level sharing.";
  if (userCredential && !level?.completed && !level?.shared) hint = "Complete one level run to enable sharing.";

  function shareLevel() {
    const shared = Timestamp.now();
    publishUserLevel(level, userData!, userCredential!, shared)
      .then(docRef => {
        updateLevel({ ...level, shared: shared.toDate().toISOString(), db_id: docRef?.id }, false);
        postSolutionData(docRef.id, level.bestSolution!, "user_level");
        Toast.show({
          type: "success",
          text1: "Congratulations!",
          text2: `Your level is now public!`,
        });
      })
      .catch(error => {
        Toast.show({
          type: "error",
          text1: "Level sharing failed.",
          text2: `Error code: ${error.code}. Please try again.`,
        });
      });
  }

  function unshareLevel() {
    updateDocument("userLevels", level.db_id!, {
      public: false,
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
    requestSubpage(0);
    Toast.show({
      type: "success",
      text1: "Level deletion completed.",
      text2: `"${level.name}" has been successfully deleted.`,
    });
  }

  function confirmThen(message: string, onConfirm: () => void) {
    Alert.alert("Are you sure?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: "destructive", onPress: onConfirm },
    ], { cancelable: true, userInterfaceStyle: darkMode ? "dark" : "light" });
  }

  if (!level) return;

  const textColor = darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR;
  const theme = colors.RED_THEME;
  const canShare = !!userCredential && userCredential.user.emailVerified && level.completed;
  const titleChanged = !!levelTitle.trim() && levelTitle.trim() !== level.name;

  return (
    <SubpageContainer lessTopPad>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>{level.name}</Text>
          <Text style={styles.caption}>Created {formatDate(level.created)}</Text>
        </View>

        <ResponsivePressable
          onPress={() => viewCallback(PageView.EDITOR)}
          customStyle={styles.preview}
          pressedSize={0.99}
        >
          <BoardPreview level={level} previewSize={3} previewWidth={previewWidth} />
        </ResponsivePressable>

        <View style={styles.stats}>
          <Stat darkMode={darkMode} label="Best solution" value={level.bestSolution ? `${level.bestSolution.length} moves` : "Unsolved"} />
          <Stat darkMode={darkMode} label="Visibility" value={level.shared ? "Shared" : "Private"} />
        </View>

        <View style={styles.actions}>
          <View style={styles.actionCell}>
            <SimpleButton
              onPress={() => viewCallback(PageView.EDITOR)}
              text="Edit Board"
              icon={graphics.HAMMER_ICON_WHITE}
              theme={theme}
              fillWidth
              centered
              main
            />
          </View>
          <View style={styles.actionCell}>
            <SimpleButton
              onPress={() => {
                playLevelCallback(level.uuid);
                viewCallback(PageView.PLAY);
              }}
              text="Playtest"
              icon={graphics.PLAY_ICON}
              fillWidth
              centered
              main
            />
          </View>
        </View>

        <View style={styles.renameRow}>
          <InputLine label="Level title" value={levelTitle} onChange={setLevelTitle} darkMode={darkMode} doFlex />
          <View style={{ marginTop: INPUT_LABEL_ROOM }}>
            <SimpleButton
              text="Save"
              onPress={() => {
                updateLevel({ uuid: level.uuid, name: levelTitle.trim() }, false);
                forceRefresh();
              }}
              disabled={!titleChanged}
              theme={theme}
              extraMargin={[10, 0, 0, 0]}
              height={INPUT_FIELD_HEIGHT}
              main
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Sharing</Text>
        <ListGroup>
          <ListRow
            title="View Solution"
            icon={graphics.KEY}
            subtitle={level.bestSolution ? undefined : "Beat the level once to record a solution."}
            onPress={() => {
              showSolution(level, PageView.MANAGE, 1);
              viewCallback(PageView.SOLUTION);
            }}
            disabled={!level.bestSolution}
          />
          {level.shared ?
            <ListRow
              title="Make Private"
              icon={graphics.OPTIONS_ICON}
              subtitle={`Shared since ${formatDate(level.shared)}.`}
              onPress={() => confirmThen("Making this level private permanently removes all of its likes and attempts.", unshareLevel)}
              disabled={!userCredential}
              last
            /> :
            <ListRow
              title="Share Online"
              icon={graphics.SHARE_ICON}
              subtitle={canShare ? "Publish this level for everyone to play." : hint}
              onPress={shareLevel}
              disabled={!canShare}
              last
            />
          }
        </ListGroup>

        <ListGroup>
          <ListRow
            title="Delete Level"
            icon={graphics.DELETE_ICON}
            onPress={() => confirmThen("Deleting this level can't be undone.", handleDeleteLevel)}
            destructive
            last
          />
        </ListGroup>
      </View>
    </SubpageContainer>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function Stat({ label, value, darkMode }: { label: string, value: string, darkMode: boolean }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.RED_THEME.MAIN_TRANSPARENT(darkMode ? 0.15 : 0.2) }]}>
      <Text style={[styles.statValue, { color: darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    paddingTop: normalize(12),
    paddingBottom: normalize(24),
  },
  header: {
    alignItems: "center",
    marginBottom: normalize(16),
  },
  name: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(24),
    textAlign: "center",
    marginBottom: normalize(2),
  },
  caption: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(13),
    color: colors.DIM_GRAY,
  },
  preview: {
    alignSelf: "center",
  },
  stats: {
    flexDirection: "row",
    gap: normalize(10),
    marginTop: normalize(16),
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: normalize(12),
    borderRadius: normalize(14),
  },
  statValue: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(18),
  },
  statLabel: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(12),
    color: colors.DIM_GRAY,
    marginTop: normalize(2),
  },
  actions: {
    flexDirection: "row",
    gap: normalize(10),
    marginTop: normalize(10),
  },
  actionCell: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: normalize(12),
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.DIM_GRAY,
    marginTop: normalize(20),
    marginBottom: normalize(8),
  },
  renameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(14),
  },
});
