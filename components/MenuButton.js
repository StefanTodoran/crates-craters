import { Pressable, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors } from '../Theme';
const win = Dimensions.get('window');

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * REQUIRED:
 * @param {string} label The text to be displayed in the button.
 * OPTIONAL:
 * @param {any} value The value to be passed to the onPress function.
 * @param {number} width The width the button should have, defaults to 50% of the view width.
 * @param {Function} onPress The function to be called on press event.
 * @param {Function} onLongPress The function to be called on long press event.
 * @param {ImageSourcePropType} icon The image to be displayed in the button, optional.
 * @param {boolean} invisible If true, the button is completely invisible (opacity of zero).
 * @param {boolean} disabled Whether or not the button can be pressed (changes appearance).
 */
export default function MenuButton({ onPress, onLongPress, value, label, icon, width, invisible, disabled }) {
  const [pressed, setPressedState] = useState(false);
  const [sound, setSound] = useState();
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/button.wav'));
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // This ensures that onPress is optional.
  const pressedFn = () => {
    if (!!onPress) {
      onPress(value);
      playSound();
    }
  }

  // This ensures that onLongPress is optional, and gives
  // the user visual feedback when it occurs.
  const longPressedFn = () => {
    setPressedState(true);
    if (!!onLongPress) {
      onLongPress(value);
    }
  }

  const bodyWidth = (width) ? width : win.width / 2;

  return (
    <Pressable onPress={pressedFn} onLongPress={longPressedFn} style={{
      ...styles.body,
      width: bodyWidth,
      borderColor: colors.MAIN_COLOR,
      backgroundColor: (pressed) ? colors.MAIN_COLOR_TRANSPARENT : "#00000000",
      opacity: (invisible) ? 0 : (disabled) ? 0.5 : 1,
    }} onPressIn={() => { setPressedState(!!onPress) }} onPressOut={() => { setPressedState(false) }}
      disabled={disabled} touchSoundDisabled={true}>
      {(icon) && <Image style={styles.icon} source={icon} />}
      <Text style={{
        ...styles.label, color: colors.MAIN_COLOR,
      }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    // borderColor: colors.MAIN_COLOR, won't auto update here, we do it in the render function
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  label: {
    textAlign: "center",
    // color: colors.MAIN_COLOR, won't auto update here, so we do it in render funciton
    fontSize: 16,
    paddingRight: 5,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: 30,
    width: 30,
  }
});