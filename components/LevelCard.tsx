import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, colors, graphics } from "../Theme";
import { getSpawnPosition } from "../util/logic";
import { getAppState } from "../util/store";
import { Level, SharedLevel } from "../util/types";
import GameBoard from "./GameBoard";
import SimpleButton from "./SimpleButton";

export enum IndicatorIcon {
  NONE,
  COMPLETION,
  SHARED,
}

/** A small stat under the level name, e.g. a difficulty pill or the best solution length. */
export interface StatChip {
  label: string,
  icon?: ImageSourcePropType,
  theme?: Theme, // Colors the chip, e.g. green for Easy. Defaults to the card's theme.
  accessibilityLabel?: string, // When the label alone is unclear, e.g. "17" next to a flag.
}

export type Difficulty = "Tutorial" | "Easy" | "Medium" | "Hard";
export const difficultyThemes: Record<Difficulty, Theme> = {
  Tutorial: colors.BLUE_THEME,
  Easy: colors.GREEN_THEME,
  Medium: colors.YELLOW_THEME,
  Hard: colors.RED_THEME,
};

/**
 * Props are all primitives or stable references (callbacks take the card's index), so
 * the memo skips re-rendering cards whose level hasn't changed. Stat chips are compared
 * by content.
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
  stats?: StatChip[],
  isLocked?: boolean,

  // An optional icon button next to Play (e.g. Solution, Manage).
  secondButtonText?: string, // Its accessibility label; no text hides the button.
  secondButtonIcon?: ImageSourcePropType,
  secondButtonDisabled?: boolean,
  onSecondButton?: (index: number) => void,

  // Likes: a heart button in the preview's corner, and double-tapping the preview.
  liked?: boolean,
  canLike?: boolean, // False e.g. when signed out, or for your own level.
  onLike?: (index: number) => void,
  // Your own level: a Manage button in that corner instead of the heart.
  onManage?: (index: number) => void,
  manageDisabled?: boolean,
  subtitle?: string, // Replaces the line under the name.
  footnote?: string, // A line of small print under the pills (e.g. plays and wins).
}

const CARD_PREVIEW_RATIO = 0.34; // Preview height, as a fraction of the card's width.
const DOUBLE_TAP_MS = 260;
const FOOTNOTE_MARGIN = normalize(6);
const FOOTNOTE_LINE = normalize(18);
/** How much taller a card with a footnote is. */
export const FOOTNOTE_HEIGHT = FOOTNOTE_MARGIN + FOOTNOTE_LINE;

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
  liked,
  canLike,
  onLike,
  onManage,
  manageDisabled,
  subtitle,
  footnote,
}: LevelCardProps) {
  const win = useWindowDimensions();
  const cardWidth = win.width * 0.9;
  const previewHeight = Math.round(cardWidth * CARD_PREVIEW_RATIO);
  const resumeCallback = showResume ? onResume : undefined;

  // Cards mounted while the page panel slides in skip their entrance animation,
  // otherwise they fade/scale separately from the panel.
  const skipEntrance = useRef(getAppState().pageAnimating).current;
  const anim = useRef(new Animated.Value(skipEntrance ? 1 : 0)).current;
  useEffect(() => {
    if (!skipEntrance) Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  // Like feedback: the corner heart pops, and a double tap shows a big heart on the board.
  const heartPop = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const wasLiked = useRef(liked);
  useEffect(() => {
    if (liked && !wasLiked.current) {
      heartPop.setValue(0.5);
      Animated.spring(heartPop, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }).start();
    }
    wasLiked.current = liked;
  }, [liked]);

  const like = () => {
    if (onLike && canLike && !liked) onLike(levelIndex);
  };

  // Two quick taps on the preview like the level.
  const lastTap = useRef(0);
  const onPreviewPress = () => {
    const now = Date.now();
    if (now - lastTap.current >= DOUBLE_TAP_MS) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.timing(burst, { toValue: 2, duration: 250, delay: 250, useNativeDriver: true }),
    ]).start();
    like();
  };

  // Fetched shared levels carry their creator's uid; your local levels don't.
  const isShared = !level.official && Object.hasOwn(level, "user_uid");
  let attributionText = subtitle;
  if (attributionText !== undefined) { /* Given. */ }
  else if (level.official) attributionText = level.introduces !== undefined ? "Tutorial Level" : "Standard Level";
  else if (Object.hasOwn(level, "user_name")) attributionText = `by ${(level as SharedLevel).user_name}`;
  else attributionText = "Designer unknown";

  // Levels to play are crates, craters once beaten; your own (in the editor) metal crates.
  const iconSource = level.official || isShared ?
    (level.completed ? graphics.CRATER : graphics.CRATE) :
    graphics.METAL_CRATE;

  const textColor = darkMode ? useTheme.MAIN_COLOR : useTheme.TINT_COLOR;
  const previewPressable = !!onLike && !!canLike;

  return (
    <Animated.View style={[
      styles.container,
      {
        width: cardWidth,
        borderColor: resumeCallback ? useTheme.DARK_COLOR : useTheme.MAIN_TRANSPARENT(0.8),
        borderWidth: resumeCallback ? 2 : 1,
        backgroundColor: resumeCallback ? useTheme.MAIN_TRANSPARENT(0.25) : (darkMode ? useTheme.MAIN_TRANSPARENT(0.12) : useTheme.OFF_WHITE),
        opacity: anim,
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
      },
    ]}>
      <View style={[styles.preview, {
        height: previewHeight,
        backgroundColor: darkMode ? useTheme.NEAR_BLACK : useTheme.LIGHT_COLOR,
        borderBottomColor: useTheme.MAIN_TRANSPARENT(0.8),
      }]}>
        {/* A sibling of the corner button, so that button stays accessible. */}
        <Pressable
          onPress={previewPressable ? onPreviewPress : undefined}
          disabled={!previewPressable}
          accessible={false} // The heart button is the accessible way to like.
          style={StyleSheet.absoluteFill}
        >
          <CardPreview level={level} width={cardWidth - 2} height={previewHeight} />
        </Pressable>

        {isLocked && <View pointerEvents="none" style={[
          styles.lockOverlay,
          { backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.45) : colors.OFF_WHITE_TRANSPARENT(0.55) },
        ]}>
          <Image style={styles.lockIcon} source={graphics.LOCK_ICON_GLOW} />
        </View>}

        {!!onLike && <Animated.Image
          // @ts-expect-error pointerEvents works on Image, but isn't in its types.
          pointerEvents="none"
          source={graphics.LIKE_ICON}
          style={[styles.burst, {
            opacity: burst.interpolate({ inputRange: [0, 0.5, 1, 2], outputRange: [0, 1, 1, 0] }),
            transform: [{ scale: burst.interpolate({ inputRange: [0, 1, 2], outputRange: [0.3, 1, 1.15] }) }],
          }]}
        />}

        {onManage ?
          <CornerButton
            icon={graphics.HAMMER_ICON}
            label="Manage"
            onPress={() => onManage(levelIndex)}
            disabled={manageDisabled}
            darkMode={darkMode}
          /> :
          !!onLike && <LikeButton liked={!!liked} canLike={!!canLike} onPress={like} pop={heartPop} darkMode={darkMode} />}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <View style={styles.center}>
            <Image style={styles.bigIcon} source={iconSource} />
            {!noNumber && <Text allowFontScaling={false} style={styles.number}>{levelIndex + 1}</Text>}
          </View>

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

          <View style={styles.indicators}>
            {indicatorIcon === IndicatorIcon.COMPLETION && resumeCallback && <Image style={styles.icon} source={graphics.PLAYER} />}
            {indicatorIcon === IndicatorIcon.COMPLETION && level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
            {indicatorIcon === IndicatorIcon.SHARED && (level as SharedLevel).shared && <Image style={styles.icon} source={graphics.SHARE_ICON_RED} />}
          </View>
        </View>

        <View style={styles.chips}>
          {stats?.map(chip => <Chip key={chip.label} chip={chip} cardTheme={useTheme} darkMode={darkMode} textColor={textColor} />)}
        </View>
        {!!footnote && <Text allowFontScaling={false} numberOfLines={1} style={[styles.footnote, { color: textColor }]}>
          {footnote}
        </Text>}

        <View style={styles.buttonRow}>
          {onSecondButton && !!secondButtonText && <View style={styles.button}>
            <SimpleButton
              text={secondButtonText}
              icon={secondButtonIcon}
              disabled={secondButtonDisabled}
              onPress={() => onSecondButton(levelIndex)}
              theme={useTheme}
              height={BUTTON_HEIGHT}
              fillWidth
              centered
            />
          </View>}

          <View style={styles.button}>
            {resumeCallback ?
              <SimpleButton text="Resume" icon={graphics.KEY_ICON} main theme={useTheme} onPress={resumeCallback} height={BUTTON_HEIGHT} fillWidth centered /> :
              <SimpleButton
                text={isLocked ? "Locked" : "Play"}
                icon={isLocked ? graphics.LOCK_ICON_WHITE : graphics.PLAY_ICON}
                main
                theme={useTheme}
                onPress={() => onPlay(levelIndex)}
                disabled={isLocked}
                height={BUTTON_HEIGHT}
                fillWidth
                centered
              />}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}, (prev, next) => {
  for (const key of Object.keys(next) as (keyof LevelCardProps)[]) {
    if (key === "stats") continue;
    if (prev[key] !== next[key]) return false;
  }
  return statsKey(prev.stats) === statsKey(next.stats);
});

export default LevelCard;

const statsKey = (stats?: StatChip[]) => stats?.map(chip => `${chip.label}|${chip.theme?.NAME}`).join(",") ?? "";

function Chip({ chip, cardTheme, darkMode, textColor }: {
  chip: StatChip,
  cardTheme: Theme,
  darkMode: boolean,
  textColor: string,
}) {
  const theme = chip.theme ?? cardTheme;
  const color = chip.theme ? (darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR) : textColor;
  return (
    <View
      accessible
      accessibilityLabel={chip.accessibilityLabel ?? chip.label}
      style={[styles.chip, { backgroundColor: theme.MAIN_TRANSPARENT(darkMode ? 0.25 : 0.3) }]}
    >
      {/* The icon takes the text color, so it matches on any card theme. */}
      {chip.icon && <Image source={chip.icon} style={[styles.chipIcon, { tintColor: color }]} />}
      <Text allowFontScaling={false} numberOfLines={1} style={[
        styles.chipText,
        { color },
      ]}>
        {chip.label}
      </Text>
    </View>
  );
}

/** A round heart button: outlined, filled once liked. */
function LikeButton({ liked, canLike, onPress, pop, darkMode }: {
  liked: boolean,
  canLike: boolean,
  onPress: () => void,
  pop?: Animated.Value,
  darkMode: boolean,
}) {
  return (
    <CornerButton
      icon={liked ? graphics.LIKE_ICON : graphics.LIKE_ICON_OUTLINE}
      label={liked ? "Liked" : "Like"}
      onPress={onPress}
      disabled={!canLike || liked}
      dimmed={!canLike && !liked}
      selected={liked}
      pop={pop}
      darkMode={darkMode}
    />
  );
}

/** A round icon button over the board preview, on a solid circle so it reads over any board. */
function CornerButton({ icon, label, onPress, disabled, dimmed = disabled, selected, pop, darkMode }: {
  icon: ImageSourcePropType,
  label: string,
  onPress: () => void,
  disabled?: boolean,
  dimmed?: boolean,
  selected?: boolean,
  pop?: Animated.Value,
  darkMode: boolean,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dimmed, selected }}
      style={({ pressed }) => [styles.cornerButton, pressed && { transform: [{ scale: 0.92 }] }, {
        backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.75) : colors.OFF_WHITE_TRANSPARENT(0.9),
      }]}
    >
      <Animated.Image
        source={icon}
        style={[styles.cornerIcon, { opacity: dimmed ? 0.5 : 1 }, pop && { transform: [{ scale: pop }] }]}
      />
    </Pressable>
  );
}

/**
 * The board, as wide as the card, cropped to the preview's height around the spawn.
 * Every card has the same height, whatever its board's size.
 */
function CardPreview({ level, width, height }: { level: Level, width: number, height: number }) {
  const { board } = level;
  const tileSize = Math.ceil(width / board.width);
  const rows = Math.min(board.height, Math.ceil(height / tileSize) + 1);
  const spawnRow = useMemo(() => getSpawnPosition(board).y, [board]);
  const top = Math.max(0, Math.min(board.height - rows, spawnRow - Math.floor(rows / 2)));
  const slice = useMemo(() => board.slice(top, top + rows), [board, top, rows]);
  // Where the slice is taller than the preview, center the spawn row (without showing
  // past the slice's ends); otherwise center the slice.
  const sliceHeight = rows * tileSize;
  const offset = sliceHeight > height ?
    Math.max(height - sliceHeight, Math.min(0, height / 2 - (spawnRow - top + 0.5) * tileSize)) :
    (height - sliceHeight) / 2;

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: offset - 1, left: (width - tileSize * board.width) / 2 - 1 }}>
      <GameBoard board={slice} overrideTileSize={tileSize} />
    </View>
  );
}

const BUTTON_HEIGHT = normalize(42);
const CHIP_HEIGHT = normalize(30);

const styles = StyleSheet.create({
  container: {
    borderRadius: normalize(14),
    marginVertical: normalize(10),
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    overflow: "hidden",
    borderBottomWidth: 1,
  },
  footnote: {
    marginTop: FOOTNOTE_MARGIN,
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(13),
    height: FOOTNOTE_LINE, // Fixed, so a card's height is known without measuring it.
  },
  info: {
    paddingHorizontal: normalize(12),
    paddingTop: normalize(10),
    paddingBottom: normalize(12),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    height: normalize(44),
  },
  chips: {
    flexDirection: "row",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: normalize(5),
    marginTop: normalize(8),
    height: CHIP_HEIGHT,
  },
  buttonRow: {
    flexDirection: "row",
    gap: normalize(10),
    marginTop: normalize(5), // SimpleButton adds 5 more above and below.
  },
  button: {
    flex: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: CHIP_HEIGHT,
    paddingHorizontal: normalize(8),
    borderRadius: normalize(9),
  },
  chipIcon: {
    width: normalize(17),
    height: normalize(17),
    marginRight: normalize(5),
  },
  chipText: {
    fontFamily: "Montserrat-Medium",
    fontSize: normalize(Platform.OS === "android" ? 13 : 14), // Android draws the font wider.
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
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
  indicators: {
    flexDirection: "row",
    gap: normalize(4),
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
    flex: 1,
    justifyContent: "center",
    marginLeft: normalize(10),
  },
  levelName: {
    marginTop: 0,
    marginBottom: 0,
  },
  designerName: {
    marginTop: -normalize(5),
    marginBottom: 0,
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
  burst: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    width: normalize(84),
    height: normalize(84),
    marginTop: -normalize(42),
  },
  cornerButton: {
    position: "absolute",
    top: normalize(8),
    right: normalize(8),
    width: normalize(42),
    height: normalize(42),
    borderRadius: normalize(21),
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({ android: { elevation: 2 } }),
  },
  cornerIcon: {
    width: normalize(26),
    height: normalize(26),
  },
});
