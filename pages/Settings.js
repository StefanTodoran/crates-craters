import { StyleSheet, Text, Dimensions, View, ScrollView } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";

import { colors, graphics, nextTheme } from '../Theme';
import MenuButton from '../components/MenuButton';
import SliderBar from '../components/SliderBar';
import { GlobalContext } from '../GlobalContext';
import TextStyles, { normalize } from '../TextStyles';

export default function Settings({ pageCallback, darkModeCallback, audioModeCallback, setThemeCallback, setSensitivityCallback, setTapDelayCallback }) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

  const [newDragSens, setNewDragSens] = useState(dragSensitivity);
  const [newTapDelay, setNewTapDelay] = useState(doubleTapDelay);

  const updateSettings = useRef(undefined);

  useEffect(() => {
    updateSettings.current = () => {
      // Anything in here is fired on component unmount.
      // We don't update useContext directly since it is quite slow.
      // The reason we don't just return this cleanup function in the
      // useEffect below is that newDragSens and newTapDelay wouldn't 
      // update. But we also can't return this function in this 
      // useEffect or this slow function would happen every time state 
      // changes, defeating the whole purpose.
      
      setSensitivityCallback(newDragSens);
      setTapDelayCallback(newTapDelay);
    }
  }, [newDragSens, newTapDelay]);

  useEffect(() => {
    return () => {
      updateSettings.current();
    }
  }, []);

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    }} overScrollMode="never" showsVerticalScrollIndicator={false}>
      <View style={styles.buttonsContainer}>
        <Text style={[TextStyles.subtitle(darkMode), { width: "100%", marginBottom: 0 }]}>
          Settings
        </Text>

        <MenuButton onPress={darkModeCallback} value={null} label="Toggle Dark Mode" icon={graphics.NIGHT_MODE_ICON} />
        <MenuButton onPress={() => {
          const newTheme = nextTheme();
          setThemeCallback(newTheme);
        }} value={null} label="Change App Theme" icon={graphics.THEME_ICON} />

        <View style={{ height: 15 }} />
        <SliderBar label="Drag Sensitivity" value={newDragSens} units={"%"}
          minValue={10} maxValue={200} changeCallback={setNewDragSens}
          mainColor={darkMode ? colors.MAIN_PURPLE : colors.DARK_PURPLE}
          knobColor={darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE}
        />
        <SliderBar label="Double Tap Delay" value={newTapDelay} units={"ms"}
          minValue={100} maxValue={500} changeCallback={setNewTapDelay}
          mainColor={darkMode ? colors.MAIN_PURPLE : colors.DARK_PURPLE}
          knobColor={darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE}
        />

        <MenuButton onPress={audioModeCallback} value={null} label="Toggle Sounds" icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON} />
        <MenuButton onPress={pageCallback} value={false} label="Go Back" icon={graphics.DOOR_ICON} />
      </View>
    </ScrollView>
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
    marginBottom: normalize(32),
  },
  scrollContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    overflow: "hidden",
  }
});