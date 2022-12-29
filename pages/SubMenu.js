import { StyleSheet, Image, Dimensions } from 'react-native';
import React from "react";

import { colors, graphics } from '../Theme';
import MenuButton from '../components/MenuButton';

export default function SubMenu({ pageCallback, game }) {
  return (
    <>
      <Image style={styles.banner} source={graphics.TITLE_BANNER} />

      <MenuButton onPress={pageCallback} value="play_level"
        label="Resume Game" icon={graphics.KEY} disabled={!game || game.won || game.playtest}/>

      <MenuButton onPress={pageCallback} value="level_select" label="Level Select" icon={graphics.FLAG} />
      <MenuButton onPress={pageCallback} value="level_editor" label="Level Editor" icon={graphics.HAMMER_ICON} />
      {/* <MenuButton onPress={pageCallback} value="share_levels" label="Share Levels" icon={graphics.SHARE_ICON} /> */}

      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={graphics.DOOR} />
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
    width: sizeFromWidthPercent(0.9, 141, 681)[0],
    height: sizeFromWidthPercent(0.9, 141, 681)[1],
  },
  text: darkMode => ({
    width: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  }
});