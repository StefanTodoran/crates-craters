import { memo, useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, Text, View } from "react-native";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, colors, graphics } from "../Theme";
import { Level, SharedLevel } from "../util/types";
import BoardPreview from "./BoardPreview";
import SimpleButton from "./SimpleButton";

const win = Dimensions.get("window");

export enum IndicatorIcon {
  NONE,
  COMPLETION,
  SHARED,
}

interface LevelCardProps {
  playCallback?: () => void, // The callback used to initiate the current level for playing.
  resumeCallback?: () => void, // Used to resume play if this level is currently being played.
  level: Level,
  levelIndex: number,
  darkMode: boolean,
  useTheme: Theme,
  noNumber?: boolean,
  indicatorIcon?: IndicatorIcon,
  stats?: string[],
  children?: React.ReactNode,
}

const LevelCard = memo(function ({
  playCallback,
  resumeCallback,
  level,
  levelIndex,
  darkMode,
  useTheme,
  noNumber,
  indicatorIcon,
  stats,
  children,
}: LevelCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 200,
      useNativeDriver: true
    }).start(callback);
  }
  useEffect(() => setAnimTo(1), []);

  let attributionText;
  if (level.official && level.best) attributionText = `Best: ${level.best} moves`;
  else if (level.official) attributionText = "Standard Level";
  else if (Object.hasOwn(level, "user_name")) attributionText = `Designed by "${(level as SharedLevel).user_name}"`;
  else attributionText = "Designed by you";

  let iconSource;
  if (level.official || useTheme.NAME === "PURPLE") iconSource = level.completed ? graphics.CRATER : graphics.CRATE;
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
            {!noNumber && <Text allowFontScaling={false} style={styles.number}>{levelIndex + 1}</Text>}
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

        <View style={styles.rowFlexStart}>
          {indicatorIcon === IndicatorIcon.COMPLETION && resumeCallback && <Image style={styles.icon} source={graphics.PLAYER} />}
          {indicatorIcon === IndicatorIcon.COMPLETION && level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
          {indicatorIcon === IndicatorIcon.SHARED && (level as SharedLevel).shared && <Image style={styles.icon} source={graphics.SHARE_ICON_RED} />}
        </View>
      </View>

      <View style={styles.row}>

        <BoardPreview
          level={level}
          previewSize={2}
          previewWidth={0.5}
        >
          {stats && <Text style={[
            styles.boardOverlay,
            {
              backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.65) : colors.NEAR_BLACK_TRANSPARENT(0.65),
              color: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE,
            },
          ]}>{stats.join("\n")}</Text>}
        </BoardPreview>

        <View style={styles.buttonsContainer}>
          {playCallback && <SimpleButton
            text="Play"
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

          {children}
        </View>
      </View>

    </Animated.View>
  );
});

export default LevelCard;

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
  boardOverlay: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: "Montserrat-Medium",
    fontWeight: "normal",
    fontSize: normalize(16),
    letterSpacing: 1,
  }
});