import { StyleSheet, Text, Dimensions, View } from 'react-native';
import React, { useContext } from "react";

import { graphics, nextTheme } from '../Theme';
import MenuButton from '../components/MenuButton';
import SliderBar from '../components/SliderBar';
import { GlobalContext } from '../GlobalContext';
import TextStyles from '../TextStyles';

export default function Settings({ pageCallback, darkModeCallback, audioModeCallback, setThemeCallback, setSensitivityCallback, setTapDelayCallback }) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

  return (
    <>
      <View style={styles.buttonsContainer}>
        <Text style={[TextStyles.subtitle(darkMode), {width: "100%", marginBottom: 0}]}>
          Settings
        </Text>

        <MenuButton onPress={darkModeCallback} value={null} label="Toggle Dark Mode" icon={graphics.NIGHT_MODE_ICON} />
        <MenuButton onPress={() => {
          const newTheme = nextTheme();
          setThemeCallback(newTheme);
        }} value={null} label="Change App Theme" icon={graphics.THEME_ICON} />

        <View style={{ height: 15 }} />
        <SliderBar label="Drag Sensitivity" value={dragSensitivity} units={"%"}
          minValue={10} maxValue={200} changeCallback={setSensitivityCallback} darkMode={darkMode} />
        <SliderBar label="Double Tap Delay" value={doubleTapDelay} units={"ms"}
          minValue={100} maxValue={500} changeCallback={setTapDelayCallback} darkMode={darkMode} />

        <MenuButton onPress={audioModeCallback} value={null} label="Toggle Sounds" icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON} />
        <MenuButton onPress={pageCallback} value={false} label="Back to Menu" icon={graphics.DOOR} />
      </View>
    </>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
const win = Dimensions.get('window');


const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: win.width * 0.55,
  },
});