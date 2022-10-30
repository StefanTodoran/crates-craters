import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React from "react";
import Colors from '../Colors';
import MenuButton from '../components/MenuButton';

export default function HowToPlay({ pageCallback, darkMode }) {
  return (
    <>
      <Image style={styles.banner} source={require('../assets/how_to_banner.png')} />

      <Text style={styles.text(darkMode)}>
        The objective of the game is simple: collect all of the coins, before making your way to the
        finish flag.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={require('../assets/flag.png')} />
        <Image style={styles.icon} source={require('../assets/coin.png')} />
      </View>

      <Text style={styles.text(darkMode)}>
        There are, however, a number of obstacles in your way. The first one are doors. All doors
        start off locked, and must be unlocked with a key. Any key can unlock any door, but each key
        is single use.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={require('../assets/door.png')} />
        <Image style={styles.icon} source={require('../assets/key.png')} />
      </View>

      <Text style={styles.text(darkMode)}>
        The primary obstacle are crates and craters. You can't walk on either of these
        tiles. However, if there is either an empty space or a crater behind a crate, you can push
        it. If you push a crate into a crater, it "fills" the crater, creating a walkable tile.
      </Text>
      <View style={styles.row}>
        <Image style={styles.icon} source={require('../assets/crate.png')} />
        <Image style={styles.icon} source={require('../assets/crater.png')} />
      </View>

      <Text style={styles.text(darkMode)}>
        You can undo up to 5 moves. Swipe in any direction to move one tile in that direction. You cannot move diagonally.
        Good luck out there!
      </Text>

      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={require('../assets/door.png')}/>
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
    maxWidth: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? Colors.MAIN_BLUE : Colors.DARK_BLUE,
  }),
  icon: {
    height: 30,
    width: 30,
  }
});