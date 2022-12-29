import { Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useContext } from "react";

import { colors, graphics } from '../Theme';
import MenuButton from '../components/MenuButton';
import { GlobalContext } from '../GlobalContext';

export default function ShareLevels({ pageCallback }) {
  const { darkMode, _ } = useContext(GlobalContext);

  return (
    <>
      <Image style={styles.banner} source={graphics.SHARE_BANNER} />

      <Text style={styles.text(darkMode)}>
        Share page placeholder.
      </Text>

      <MenuButton onPress={() => {}} value="" label="Scan Level QR" icon={graphics.LOAD_ICON} />

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
    width: sizeFromWidthPercent(0.8, 146, 600)[0],
    height: sizeFromWidthPercent(0.8, 146, 600)[1],
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