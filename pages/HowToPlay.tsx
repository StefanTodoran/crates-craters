import { useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import SubpageContainer from "../components/SubpageContainer";

export default function HowToPlay() {
  const { darkMode } = useContext(GlobalContext);

  return (
    <SubpageContainer>
      <Text style={[TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR), { marginTop: "-5%" }]}>
        Controls
      </Text>
      <Text style={TextStyles.paragraph(darkMode)}>
        Swipe anywhere on the screen to control the player. Swipe in any
        direction to move one tile in that direction. You cannot move
        diagonally. If there is a tile you could navigate to, double tap on
        that tile to save some time and skip to that position.
      </Text>

      <Text style={TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR)}>
        Objective
      </Text>
      <Text style={TextStyles.paragraph(darkMode)}>
        The goal of the game is to collect all coins before making your way to the finish flag.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.FLAG} />
        <Image style={styles.icon} source={graphics.COIN} />
      </View>
      <Text style={TextStyles.paragraph(darkMode)}>
        This is the only requirement to win. You do not need to collect all keys, open all doors, or detonate all bombs.
      </Text>

      <Text style={TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR)}>
        Obstacles
      </Text>
      <Text style={TextStyles.paragraph(darkMode)}>
        The first obstacle are doors. Any key can unlock any door, but each key
        is single use. An opened door is replaced by an empty tile.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.DOOR} />
        <Image style={styles.icon} source={graphics.KEY} />
      </View>

      <Text style={TextStyles.paragraph(darkMode)}>
        The primary obstacle are crates and craters. You can't walk on either
        of these tiles. However, if there is either a walkable space or a crater
        behind a crate, you can "walk into it" to push it. If you push a crate
        into a crater, it fills the crater, creating a walkable tile.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.CRATE} />
        <Image style={styles.icon} source={graphics.CRATER} />
      </View>

      <Text style={TextStyles.paragraph(darkMode)}>
        Another obstacle are one-way tiles. These tiles cannot be entered from
        the side with the bar (opposite direction of the arrow), but can be entered
        from every other side. Pushables can be pushed through one-way tiles following the same rules.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.ONE_WAY_LEFT} />
        <Image style={styles.icon} source={graphics.ONE_WAY_UP} />
        <Image style={styles.icon} source={graphics.ONE_WAY_DOWN} />
        <Image style={styles.icon} source={graphics.ONE_WAY_RIGHT} />
      </View>

      <Text style={TextStyles.paragraph(darkMode)}>
        Lastly there are bombs. These can be pushed just like crates, but
        cannot fill in craters. After a set number of turns, the fuse expires
        and the bomb explodes adjacent crates.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.BOMB} />
        <Image style={styles.icon} source={graphics.EXPLOSION} />
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: normalize(16),
  },
  icon: {
    height: 30,
    width: 30,
  },
});