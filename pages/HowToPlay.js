import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useContext } from "react";

import { colors, graphics } from '../Theme';
import MenuButton from '../components/MenuButton';
import { GlobalContext } from '../GlobalContext';

export default function HowToPlay({ pageCallback }) {
  const { darkMode, dragSensitivity } = useContext(GlobalContext);
  
  return (
    <>
      <Image style={styles.banner} source={graphics.HOW_TO_BANNER} />

      <Text style={styles.text(darkMode)}>
        The objective of the game is simple: collect all of the coins before making your way to the
        finish flag.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.FLAG} />
        <Image style={styles.icon} source={graphics.COIN} />
      </View>

      <Text style={styles.text(darkMode)}>
        There are, however, a number of obstacles in your way. The first one are doors. All doors
        start off locked, and must be unlocked with a key. Any key can unlock any door, but each key
        is single use.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.DOOR} />
        <Image style={styles.icon} source={graphics.KEY} />
      </View>

      <Text style={styles.text(darkMode)}>
        The primary obstacle are crates and craters. You can't walk on either of these
        tiles. However, if there is either an empty space or a crater behind a crate, you can push
        it. If you push a crate into a crater, it "fills" the crater, creating a walkable tile.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={graphics.CRATE} />
        <Image style={styles.icon} source={graphics.CRATER} />
      </View>

      <Text style={styles.text(darkMode)}>
        Swipe in any direction to move one tile in that direction. You cannot move diagonally.
        Good luck out there!
      </Text>

      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={graphics.DOOR}/>
    </>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
const win = Dimensions.get('window');
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.6, 141, 450)[0],
    height: sizeFromWidthPercent(0.6, 141, 450)[1],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  text: darkMode => ({
    width: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  icon: {
    height: 30,
    width: 30,
  }
});