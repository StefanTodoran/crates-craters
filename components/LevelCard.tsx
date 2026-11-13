import { memo, useEffect, useRef } from "react";
import { Animated, Image, ImageSourcePropType, Share, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, colors, graphics } from "../Theme";
import { getAppState } from "../util/store";
import { Level, SharedLevel } from "../util/types";
import BoardPreview from "./BoardPreview";
import NativeMenu, { NativeMenuItem } from "./NativeMenu";
import SimpleButton from "./SimpleButton";

export enum IndicatorIcon {
  NONE,
  COMPLETION,
  SHARED,
}

/**
 * Props are all primitives or stable references (callbacks take the card's index), so
 * the memo skips re-rendering cards whose level hasn't changed.
 */
interface LevelCardProps {
  onPlay: (index: number) => void, // Starts playing this level.
  onResume?: () => void, // Resumes play, if this level is the one in progress.
  showResume?: boolean, // Show Resume instead of Play.
  level: Level,
  levelIndex: number,
  darkMode: boolean,
  useTheme: Theme,
  noNumber?: boolean,
  indicatorIcon?: IndicatorIcon,
  stats?: string, // Shown over the board preview, one stat per line.
  isLocked?: boolean,

  // An optional second button under Play.
  secondButtonText?: string,
  secondButtonIcon?: ImageSourcePropType,
  secondButtonDisabled?: boolean,
  onSecondButton?: (index: number) => void,
}

const LevelCard = memo(function ({
  onPlay,
  onResume,
  showResume,
  level,
  levelIndex,
  darkMode,
  useTheme,
  noNumber,
  indicatorIcon,
  stats,
  isLocked,
  secondButtonText,
  secondButtonIcon,
  secondButtonDisabled,
  onSecondButton,
}: LevelCardProps) {
  const win = useWindowDimensions();
  const resumeCallback = showResume ? onResume : undefined;
  // Cards mounted while the page panel slides in skip their entrance animation,
  // otherwise they fade/scale separately from the panel.
  const skipEntrance = useRef(getAppState().pageAnimating).current;
  const anim = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 200,
      useNativeDriver: true
    }).start(callback);
  }
  useEffect(() => { if (!skipEntrance) setAnimTo(1); }, []);

  let attributionText;
  if (level.official && level.bestSolution) attributionText = `Best: ${level.bestSolution.length} moves`;
  else if (level.official && level.introduces === undefined) attributionText = "Standard Level";
  else if (level.official && level.introduces !== undefined) attributionText = "Tutorial Level";
  else if (Object.hasOwn(level, "user_name")) attributionText = `Designed by "${(level as SharedLevel).user_name}"`;
  else attributionText = "Designer unknown";

  let iconSource;
  if (level.official || useTheme.NAME === "PURPLE") iconSource = level.completed ? graphics.CRATER : graphics.CRATE;
  else iconSource = graphics.METAL_CRATE;

  // Long press opens a system context menu with the card's actions.
  const menuItems: NativeMenuItem[] = [];
  if (!isLocked) menuItems.push(resumeCallback ?
    { id: "resume", title: "Resume", sfSymbol: "play.fill", onPress: resumeCallback } :
    { id: "play", title: "Play", sfSymbol: "play.fill", onPress: () => onPlay(levelIndex) });
  if (onSecondButton && secondButtonText) menuItems.push({
    id: "second",
    title: secondButtonText,
    sfSymbol: secondButtonText.startsWith("Like") ? "heart" : "hammer",
    disabled: secondButtonDisabled,
    onPress: () => onSecondButton(levelIndex),
  });
  if (Object.hasOwn(level, "user_name")) menuItems.push({
    id: "share",
    title: "Share",
    sfSymbol: "square.and.arrow.up",
    onPress: () => shareLevel(level as SharedLevel),
  });

  return (
    <NativeMenu items={menuItems} title={level.name} openOnLongPress>
      <Animated.View style={[
        styles.container,
        {
          width: win.width * 0.9,
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
            {isLocked && <View style={[
              styles.lockOverlay,
              { backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.45) : colors.OFF_WHITE_TRANSPARENT(0.55) },
            ]}>
              <Image style={styles.lockIcon} source={graphics.LOCK_ICON_GLOW} />
            </View>}
            {/* A View does the centering: textAlignVertical is Android-only. */}
            {stats && <View style={[
              styles.boardOverlay,
              { backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.65) : colors.NEAR_BLACK_TRANSPARENT(0.65) },
            ]}>
              <Text style={[
                styles.boardOverlayText,
                { color: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE },
              ]}>{stats}</Text>
            </View>}
          </BoardPreview>

          <View style={styles.buttonsContainer}>
            {!resumeCallback && <SimpleButton
              text={isLocked ? "Locked" : "Play"}
              icon={isLocked ? graphics.LOCK_ICON_WHITE : graphics.PLAY_ICON}
              main={true}
              theme={useTheme}
              onPress={() => onPlay(levelIndex)}
              disabled={isLocked}
            />}

            {resumeCallback && <SimpleButton
              text={"Resume"}
              icon={graphics.KEY_ICON}
              main={true}
              theme={useTheme}
              onPress={resumeCallback}
            />}

            {onSecondButton && <SimpleButton
              text={secondButtonText}
              disabled={secondButtonDisabled}
              icon={secondButtonIcon}
              onPress={() => onSecondButton(levelIndex)}
              theme={useTheme}
            />}
          </View>
        </View>

      </Animated.View>
    </NativeMenu>
  );
});

/** Opens the system share sheet for a shared level (found in-app by searching its name). */
function shareLevel(level: SharedLevel) {
  // Called from the context menu: iOS can't present the sheet until the menu has
  // finished dismissing.
  setTimeout(() => Share.share({
    message: `Try "${level.name}" by ${level.user_name} in Crates & Craters! Search for it in the Shared levels.`,
  }).catch(() => { }), 500);
}

export default LevelCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  lockIcon: {
    width: normalize(50),
    height: normalize(50),
  },
  boardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  boardOverlayText: {
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
    fontWeight: "normal",
    fontSize: normalize(16),
    letterSpacing: 1,
  }
});