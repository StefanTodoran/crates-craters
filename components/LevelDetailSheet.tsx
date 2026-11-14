import { useContext } from "react";
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { calcPreviewTileSize } from "../util/board";
import { SharedLevel } from "../util/types";
import GameBoard from "./GameBoard";
import { Chip, LikeButton, StatChip } from "./LevelCard";
import SimpleButton from "./SimpleButton";

interface Props {
  level?: SharedLevel, // Shown while set.
  stats: StatChip[], // Everything known about the level.
  liked: boolean,
  canLike: boolean,
  onLike: () => void,
  canManage?: boolean, // Your own level: Manage instead of Like. undefined: not yours.
  onManage: () => void,
  onPlay: () => void,
  onClose: () => void,
}

/**
 * A shared level's details, opened from its card: all the stats, Like and Play, and the
 * whole board. A half-height sheet on iOS (call prepareNextSheet before setting `level`).
 */
export default function LevelDetailSheet({ level, stats, liked, canLike, onLike, canManage, onManage, onPlay, onClose }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const win = useWindowDimensions();
  const theme = purpleTheme;

  return (
    <Modal
      visible={!!level}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
      backdropColor={ios ? "transparent" : undefined}
    >
      {level && <ScrollView
        style={{ backgroundColor: ios ? "transparent" : (darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE) }}
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleRow}>
          <Image style={styles.icon} source={level.completed ? graphics.EXPLOSION : graphics.METAL_CRATE} />
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

        <View style={styles.buttons}>
          {canManage !== undefined ?
            <SimpleButton text="Manage" icon={graphics.HAMMER_ICON} onPress={onManage} disabled={!canManage} height={BUTTON_HEIGHT} /> :
            <LikeButton liked={liked} canLike={canLike} onPress={onLike} darkMode={darkMode} inline />}
          <View style={styles.play}>
            <SimpleButton text="Play" icon={graphics.PLAY_ICON} main onPress={onPlay} height={BUTTON_HEIGHT} fillWidth centered />
          </View>
        </View>

        <View style={styles.board}>
          <GameBoard board={level.board} overrideTileSize={calcPreviewTileSize(level.board.width, 0.9, win)} />
        </View>
      </ScrollView>}
    </Modal>
  );
}

const ios = Platform.OS === "ios";
const BUTTON_HEIGHT = normalize(46);

const styles = StyleSheet.create({
  content: {
    paddingTop: normalize(24),
    paddingBottom: normalize(40),
    paddingHorizontal: "5%",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: normalize(44),
    height: normalize(44),
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
    marginTop: normalize(16),
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
    marginTop: normalize(18),
  },
  play: {
    flex: 1,
  },
  board: {
    alignItems: "center",
    marginTop: normalize(22),
  },
});
