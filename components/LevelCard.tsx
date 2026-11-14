import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GlassView, glassAvailable } from "../modules/glass-view";
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
  onOpenDetails?: (index: number) => void, // Tapping the preview.
  // Your own level: a Manage button in that corner instead of the heart.
  onManage?: (index: number) => void,
  manageDisabled?: boolean,
}

export const CARD_PREVIEW_RATIO = 0.4; // Preview height, as a fraction of the card's width.
const DOUBLE_TAP_MS = 260;

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
  onOpenDetails,
  onManage,
  manageDisabled,
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

  // One tap opens the details; two quick taps like the level instead.
  const lastTap = useRef(0);
  const pendingOpen = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pendingOpen.current), []);
  const onPreviewPress = () => {
    const now = Date.now();
    if (onLike && now - lastTap.current < DOUBLE_TAP_MS) {
      clearTimeout(pendingOpen.current);
      lastTap.current = 0;
      if (!canLike) return;
      burst.setValue(0);
      Animated.sequence([
        Animated.spring(burst, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        Animated.timing(burst, { toValue: 2, duration: 250, delay: 250, useNativeDriver: true }),
      ]).start();
      like();
      return;
    }
    lastTap.current = now;
    if (!onOpenDetails) return;
    if (!onLike || !canLike) return onOpenDetails(levelIndex);
    clearTimeout(pendingOpen.current);
    pendingOpen.current = setTimeout(() => onOpenDetails(levelIndex), DOUBLE_TAP_MS);
  };

  // Fetched shared levels carry their creator's uid; your local levels don't.
  const isShared = !level.official && Object.hasOwn(level, "user_uid");
  let attributionText;
  if (level.official) attributionText = level.introduces !== undefined ? "Tutorial Level" : "Standard Level";
  else if (Object.hasOwn(level, "user_name")) attributionText = `by ${(level as SharedLevel).user_name}`;
  else attributionText = "Designer unknown";

  // Beaten official levels are craters, beaten shared ones explosions.
  let iconSource;
  if (level.official) iconSource = level.completed ? graphics.CRATER : graphics.CRATE;
  else if (isShared) iconSource = level.completed ? graphics.EXPLOSION : graphics.METAL_CRATE;
  else iconSource = graphics.METAL_CRATE;

  const textColor = darkMode ? useTheme.MAIN_COLOR : useTheme.TINT_COLOR;
  const previewPressable = !!onOpenDetails || (!!onLike && !!canLike);

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
      <View style={[styles.preview, { height: previewHeight, backgroundColor: darkMode ? useTheme.NEAR_BLACK : useTheme.LIGHT_COLOR }]}>
        {/* The tap target is a sibling of the corner button, so both are accessible. */}
        <Pressable
          onPress={previewPressable ? onPreviewPress : undefined}
          disabled={!previewPressable}
          accessible={!!onOpenDetails}
          accessibilityRole={onOpenDetails ? "button" : undefined}
          accessibilityLabel={onOpenDetails ? `${level.name} details` : undefined}
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
          source={graphics.LIKE_ICON_RED}
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

        <View style={styles.bottomRow}>
          <View style={styles.chips}>
            {stats?.map(chip => <Chip key={chip.label} chip={chip} cardTheme={useTheme} darkMode={darkMode} textColor={textColor} />)}
          </View>

          {onSecondButton && !!secondButtonText && <View accessible accessibilityRole="button" accessibilityLabel={secondButtonText}>
            <SimpleButton
              icon={secondButtonIcon}
              disabled={secondButtonDisabled}
              onPress={() => onSecondButton(levelIndex)}
              theme={useTheme}
              height={BUTTON_HEIGHT}
              extraMargin={[0, 8, 0, 0]}
            />
          </View>}

          {resumeCallback ?
            <SimpleButton text="Resume" icon={graphics.KEY_ICON} main theme={useTheme} onPress={resumeCallback} height={BUTTON_HEIGHT} /> :
            <SimpleButton
              text={isLocked ? "Locked" : "Play"}
              icon={isLocked ? graphics.LOCK_ICON_WHITE : graphics.PLAY_ICON}
              main
              theme={useTheme}
              onPress={() => onPlay(levelIndex)}
              disabled={isLocked}
              height={BUTTON_HEIGHT}
            />}
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

export function Chip({ chip, cardTheme, darkMode, textColor, large }: {
  chip: StatChip,
  cardTheme: Theme,
  darkMode: boolean,
  textColor: string,
  large?: boolean,
}) {
  const theme = chip.theme ?? cardTheme;
  return (
    <View
      accessible
      accessibilityLabel={chip.accessibilityLabel ?? chip.label}
      style={[styles.chip, large && styles.chipLarge, { backgroundColor: theme.MAIN_TRANSPARENT(darkMode ? 0.25 : 0.3) }]}
    >
      {chip.icon && <Image source={chip.icon} style={[styles.chipIcon, large && styles.chipIconLarge]} />}
      <Text allowFontScaling={false} numberOfLines={1} style={[
        styles.chipText,
        large && styles.chipTextLarge,
        { color: chip.theme ? (darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR) : textColor },
      ]}>
        {chip.label}
      </Text>
    </View>
  );
}

/** A round heart button: outlined, filled once liked. */
export function LikeButton({ liked, canLike, onPress, pop, darkMode, inline }: {
  liked: boolean,
  canLike: boolean,
  onPress: () => void,
  pop?: Animated.Value,
  darkMode: boolean,
  inline?: boolean, // In the layout flow, instead of in the preview's corner.
}) {
  return (
    <CornerButton
      icon={liked ? graphics.LIKE_ICON_RED : graphics.LIKE_ICON_OUTLINE}
      label={liked ? "Liked" : "Like"}
      onPress={onPress}
      disabled={!canLike || liked}
      dimmed={!canLike && !liked}
      selected={liked}
      pop={pop}
      darkMode={darkMode}
      inline={inline}
    />
  );
}

/** A round icon button over the board preview. Glass on iOS 26+. */
function CornerButton({ icon, label, onPress, disabled, dimmed = disabled, selected, pop, darkMode, inline }: {
  icon: ImageSourcePropType,
  label: string,
  onPress: () => void,
  disabled?: boolean,
  dimmed?: boolean,
  selected?: boolean,
  pop?: Animated.Value,
  darkMode: boolean,
  inline?: boolean,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dimmed, selected }}
      style={({ pressed }) => [styles.cornerButton, inline && styles.inline, pressed && { transform: [{ scale: 0.92 }] }, !glassAvailable && {
        backgroundColor: darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.7) : colors.OFF_WHITE_TRANSPARENT(0.85),
      }]}
    >
      {/* Tinted, so it stands out over a light board. */}
      <GlassView style={StyleSheet.absoluteFill} tint={darkMode ? colors.NEAR_BLACK_TRANSPARENT(0.5) : colors.OFF_WHITE_TRANSPARENT(0.65)} />
      <Animated.Image
        source={icon}
        style={[styles.cornerIcon, { opacity: dimmed ? 0.5 : 1 }, pop && { transform: [{ scale: pop }] }]}
      />
    </Pressable>
  );
}

/**
 * The board, as wide as the given width, cropped to the given height around the spawn.
 * Every card has the same height, whatever its board's size.
 */
export function CardPreview({ level, width, height }: { level: Level, width: number, height: number }) {
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

const styles = StyleSheet.create({
  container: {
    borderRadius: normalize(14),
    marginVertical: normalize(10),
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    overflow: "hidden",
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
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: normalize(8),
    height: BUTTON_HEIGHT,
  },
  chips: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    overflow: "hidden",
    gap: normalize(6),
    marginRight: normalize(8),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: normalize(26),
    paddingHorizontal: normalize(8),
    borderRadius: normalize(8),
  },
  chipLarge: {
    height: normalize(32),
    paddingHorizontal: normalize(10),
    borderRadius: normalize(10),
  },
  chipIcon: {
    width: normalize(15),
    height: normalize(15),
    marginRight: normalize(4),
  },
  chipIconLarge: {
    width: normalize(18),
    height: normalize(18),
    marginRight: normalize(6),
  },
  chipText: {
    fontFamily: "Montserrat-Medium",
    fontSize: normalize(13),
  },
  chipTextLarge: {
    fontSize: normalize(15),
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
  inline: {
    position: "relative",
    top: 0,
    right: 0,
  },
  cornerIcon: {
    width: normalize(26),
    height: normalize(26),
  },
});
