import { Pressable, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors } from '../Theme';
import { GlobalContext } from '../GlobalContext';
const width = Dimensions.get('window').width;

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * REQUIRED:
 * @param {string} label The text to be displayed in the button.
 * OPTIONAL:
 * @param {any} value The value to be passed to the onPress function.
 * @param {Function} onPress The function to be called on press event.
 * @param {Function} onLongPress The function to be called on long press event.
 * @param {ImageSourcePropType} icon The image to be displayed in the button, optional.
 * @param {boolean} invisible If true, the button is completely invisible (opacity of zero).
 * @param {boolean} disabled Whether or not the button can be pressed (changes appearance).
 * @param {boolean} allowOverflow Whether number of lines for the button text should cap at 1.
 */
export default function MenuButton({ onPress, onLongPress, value, label, icon, invisible, disabled, allowOverflow }) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

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
      if (playAudio) {
        playSound();
      }
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

  return (
    <Pressable onPress={pressedFn} onLongPress={longPressedFn} style={{
      ...styles.body,
      borderColor: colors.MAIN_COLOR,
      backgroundColor: (pressed) ? colors.MAIN_COLOR_TRANSPARENT : "#00000000",
      opacity: (invisible) ? 0 : (disabled) ? 0.5 : 1,
      transform: [{
        scale: pressed ? 0.98 : 1,
      }],
    }} onPressIn={() => { setPressedState(!!onPress) }} onPressOut={() => { setPressedState(false) }}
      disabled={disabled} touchSoundDisabled={true}>
      {(icon) && <Image style={styles.icon} source={icon} />}
      <Text numberOfLines={allowOverflow ? 0 : 1} style={{
        ...styles.label, color: colors.MAIN_COLOR,
      }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    width: "100%",
    // borderColor: colors.MAIN_COLOR, won't auto update here, we do it in the render function
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: 17.5,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    textAlign: "center",
    // fontSize: 16,
    fontSize: width * 0.04,
    marginLeft: 15,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    // height: 30,
    // width: 30,
    height: width * 0.07,
    width: width * 0.07,
  }
});