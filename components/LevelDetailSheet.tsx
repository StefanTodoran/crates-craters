import { useContext, useState } from "react";
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { graphics, purpleTheme } from "../Theme";
import { SharedLevel } from "../util/types";
import BottomSheet from "./BottomSheet";
import { CARD_PREVIEW_RATIO, CardPreview, Chip, LikeButton, StatChip } from "./LevelCard";
import SimpleButton from "./SimpleButton";

interface Props {
  level?: SharedLevel, // Shown while set.
  stats: StatChip[],
  details: string, // A line of text under the pills (plays, wins, when it was shared).
  liked: boolean,
  canLike: boolean,
  onLike: () => void,
  canManage?: boolean, // Your own level: Manage instead of Like. undefined: not yours.
  onManage: () => void,
  onPlay: () => void,
  onClose: () => void,
}

/**
 * A shared level's details, opened from its card: the same board preview, all the stats,
 * and Like and Play. A half-height sheet on iOS; tap outside or swipe down to close.
 */
export default function LevelDetailSheet({ level, stats, details, liked, canLike, onLike, canManage, onManage, onPlay, onClose }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const theme = purpleTheme;
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const previewHeight = Math.round(width * CARD_PREVIEW_RATIO);

  return (
    <BottomSheet visible={!!level} onClose={onClose} contentStyle={styles.content}>
      {level && <View onLayout={onLayout}>
        {width > 0 && <View style={[styles.preview, {
          height: previewHeight,
          borderColor: theme.MAIN_TRANSPARENT(0.8),
          backgroundColor: darkMode ? theme.NEAR_BLACK : theme.LIGHT_COLOR,
        }]}>
          <CardPreview level={level} width={width - 2} height={previewHeight} />
        </View>}

        <View style={styles.titleRow}>
          <Image style={styles.icon} source={level.completed ? graphics.CRATER : graphics.CRATE} />
          <View style={styles.titleText}>
            <Text allowFontScaling={false} numberOfLines={2} style={[TextStyles.subtitle(darkMode, theme.DARK_COLOR), styles.name]}>
              {level.name}
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={[TextStyles.paragraph(darkMode), styles.byline]}>
              by {level.user_name}
            </Text>
          </View>
          {level.completed && <Image style={styles.flag} source={graphics.FLAG_ICON} />}
        </View>

        <View style={styles.chips}>
          {stats.map(chip => <Chip
            key={chip.label}
            chip={chip}
            cardTheme={theme}
            darkMode={darkMode}
            textColor={darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR}
            large
          />)}
        </View>
        <Text allowFontScaling={false} style={[styles.details, { color: darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR }]}>
          {details}
        </Text>

        <View style={styles.buttons}>
          {canManage !== undefined ?
            <SimpleButton text="Manage" icon={graphics.HAMMER_ICON} onPress={onManage} disabled={!canManage} height={BUTTON_HEIGHT} /> :
            <LikeButton liked={liked} canLike={canLike} onPress={onLike} darkMode={darkMode} inline />}
          <View style={styles.play}>
            <SimpleButton text="Play" icon={graphics.PLAY_ICON} main onPress={onPlay} height={BUTTON_HEIGHT} fillWidth centered />
          </View>
        </View>
      </View>}
    </BottomSheet>
  );
}

const BUTTON_HEIGHT = normalize(46);

const styles = StyleSheet.create({
  content: {
    paddingTop: normalize(20),
    paddingBottom: normalize(40),
    paddingHorizontal: "5%",
  },
  preview: {
    borderWidth: 1,
    borderRadius: normalize(14),
    overflow: "hidden",
    marginBottom: normalize(14),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: normalize(40),
    height: normalize(40),
  },
  titleText: {
    flex: 1,
    marginLeft: normalize(12),
  },
  name: {
    marginVertical: 0,
  },
  byline: {
    marginTop: -normalize(4),
    marginBottom: 0,
  },
  flag: {
    width: normalize(30),
    height: normalize(30),
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: normalize(8),
    marginTop: normalize(14),
  },
  details: {
    marginTop: normalize(10),
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(14),
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    marginTop: normalize(14),
  },
  play: {
    flex: 1,
  },
});
