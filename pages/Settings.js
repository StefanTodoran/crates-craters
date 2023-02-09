import { StyleSheet, Image, Dimensions, View } from 'react-native';
import React, { useContext } from "react";

import { graphics, nextTheme } from '../Theme';
import MenuButton from '../components/MenuButton';
import SliderBar from '../components/SliderBar';
import { GlobalContext } from '../GlobalContext';

export default function Settings({ pageCallback, darkModeCallback, setThemeCallback, setSensitivityCallback, setTapDelayCallback }) {
  const { darkMode, dragSensitivity, doubleTapDelay } = useContext(GlobalContext);

  return (
    <View style={styles.buttonsContainer}>
      <Image style={styles.banner} source={graphics.SETTINGS_BANNER} />

      <MenuButton onPress={darkModeCallback} value={null} label="Toggle Dark Mode" icon={graphics.NIGHT_MODE_ICON} />
      <MenuButton onPress={() => {
        const newTheme = nextTheme();
        setThemeCallback(newTheme);
      }} value={null} label="Change App Theme" icon={graphics.THEME_ICON} />

      <View style={{height: 15}}/>
      <SliderBar label="Drag Sensitivity" value={dragSensitivity} units={"%"}
        minValue={10} maxValue={200} changeCallback={setSensitivityCallback} darkMode={darkMode} />
      <SliderBar label="Double Tap Delay" value={doubleTapDelay} units={"ms"}
        minValue={100} maxValue={500} changeCallback={setTapDelayCallback} darkMode={darkMode} />

      {/* <MenuButton onPress={pageCallback} value={"about"} label="About the App" icon={graphics.PLAYER} /> */}
      <MenuButton onPress={pageCallback} value={"home"} label="Back to Menu" icon={graphics.DOOR} />
    </View>
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
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: win.width * 0.55,
  },
  banner: {
    width: sizeFromWidthPercent(0.65, 141, 434)[0],
    height: sizeFromWidthPercent(0.65, 141, 434)[1],
  }
});