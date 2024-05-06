import { Text, View, Dimensions, Image, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import SimpleButton from "./SimpleButton";
import BoardPreview from "./BoardPreview";

import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { Level, PageView } from "../util/types";

const win = Dimensions.get("window");

interface LevelCardProps {
  playCallback?: () => void, // The callback used to initiate the current level for playing.
  resumeCallback?: () => void, // Used to resume play if this level is currently being played.
  editCallback?: () => void,
  level: Level,
  levelIndex: number,
  darkMode: boolean,
  children?: React.ReactNode,
  mode: PageView.LEVELS | PageView.MANAGE,
}

export default function LevelCard({
  playCallback,
  resumeCallback,
  editCallback,
  level,
  levelIndex,
  darkMode,
  mode,
}: LevelCardProps) {
  const useTheme = mode === PageView.LEVELS ? purpleTheme : colors.RED_THEME;

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 200,
      useNativeDriver: true
    }).start(callback);
  }

  useEffect(() => {
    setAnimTo(1);
    // setTimeout(() => {
    //   setAnimTo(1);
    // }, (levelIndex - scrollIndex) * 100);
  }, []);

  let attributionText;
  if (level.official && level.best) attributionText = `Best: ${level.best} moves`;
  else if (level.official) attributionText = "Standard Level";
  else /* if (!level.official) */ attributionText = `Designed by "${level.designer}"`;

  let iconSource; // mode === PageView.MANAGE is the same as level.official
  if (level.official) iconSource = level.completed ? graphics.CRATER : graphics.CRATE;
  else iconSource = graphics.METAL_CRATE;

  return (
    <Animated.View style={[
      styles.container,
      {
        borderColor: useTheme.DARK_COLOR,
        borderWidth: resumeCallback ? 2 : 1,
        paddingHorizontal: resumeCallback ? normalize(15) - 2 : normalize(15),
        backgroundColor: resumeCallback ? useTheme.MAIN_TRANSPARENT(0.25) : (darkMode ? useTheme.MAIN_TRANSPARENT(0.15) : useTheme.OFF_WHITE),
        opacity: anim,
        transform: [{
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        }],
      },
    ]}>

      <View style={styles.row}>
        <View style={styles.rowFlexStart}>
          {/* Icon & Number */}
          <View style={styles.center}>
            <Image
              style={styles.bigIcon}
              source={iconSource}
            />
            <Text allowFontScaling={false} style={styles.number}>{levelIndex + 1}</Text>
          </View>

          {/* Name & Designer */}
          <View style={styles.labelText}>
            <Text
              allowFontScaling={false}
              style={[TextStyles.subtitle(darkMode, useTheme.DARK_COLOR), styles.levelName]}
              numberOfLines={1}
            >{level.name}</Text>
            <Text
              allowFontScaling={false}
              style={[TextStyles.paragraph(darkMode), styles.designerName]}
              numberOfLines={1}
            >{attributionText}</Text>
          </View>
        </View>

        {mode === PageView.LEVELS && <View style={styles.rowFlexStart}>
          {resumeCallback && <Image style={styles.icon} source={graphics.PLAYER} />}
          {level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
        </View>}
      </View>

      <View style={styles.row}>
        <BoardPreview
          level={level}
          previewSize={2}
          previewWidth={0.5}
        />

        <LevelCardButtons
          playCallback={playCallback}
          resumeCallback={resumeCallback}
          editCallback={editCallback}
          mode={mode}
        />
      </View>

    </Animated.View>
  );
}

interface LevelCardButtonsProps {
  playCallback?: () => void, // The callback used to initiate the current level for playing. If not provided, the level is currently being played.
  resumeCallback?: () => void, // Used to resume play if this level is currently being played.
  editCallback?: () => void,
  mode: PageView.LEVELS | PageView.MANAGE,
}

export function LevelCardButtons({
  playCallback,
  resumeCallback,
  editCallback,
  mode,
}: LevelCardButtonsProps) {
  const useTheme = mode === PageView.LEVELS ? purpleTheme : colors.RED_THEME;

  return (
    <View style={styles.buttonsContainer}>
      {playCallback && <SimpleButton
        text={mode === PageView.MANAGE ? "Playtest" : "Play"}
        icon={graphics.PLAY_ICON}
        main={true}
        theme={useTheme}
        onPress={playCallback}
      />}

      {resumeCallback && <SimpleButton
        text={"Resume"}
        icon={graphics.KEY_ICON}
        main={true}
        theme={useTheme}
        onPress={resumeCallback}
      />}

      {!editCallback && <SimpleButton
        text={"Stats"}
        icon={graphics.SHARE_ICON}
        disabled={true}
        onPress={() => {
          // TODO: implement this page, then go to it
        }}
      />}

      {editCallback && <SimpleButton
        text={"Manage"}
        icon={mode === PageView.MANAGE ? graphics.HAMMER_ICON_RED : graphics.HAMMER_ICON}
        theme={useTheme}
        onPress={editCallback}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: win.width * 0.9,
    paddingBottom: normalize(5),
    borderRadius: normalize(10),
    marginVertical: normalize(10),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    // paddingHorizontal: normalize(15),
    paddingVertical: normalize(10),
  },
  rowFlexStart: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  center: {
    justifyContent: "center",
    alignItems: "center"
  },
  number: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: normalize(15),
    color: "#fff",
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: normalize(25),
    width: normalize(25),
  },
  bigIcon: {
    height: normalize(35),
    width: normalize(35),
  },
  labelText: {
    flexDirection: "column",
    justifyContent: "center",
    marginLeft: normalize(10)
  },
  levelName: {
    marginTop: 0,
    marginBottom: 0,
  },
  designerName: {
    marginTop: -normalize(5),
    marginBottom: 0,
  },
  buttonsContainer: {
    flexDirection: "column",
    flex: 0.9
  },
});