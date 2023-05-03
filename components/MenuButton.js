import { Pressable, Text, StyleSheet, Image, View } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import { normalize } from '../TextStyles';

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * OPTIONAL:
 * @param {string} label The text to be displayed in the button.
 * @param {any} value The value to be passed to the onPress function.
 * @param {Function} onPress The function to be called on press event.
 * @param {Function} onLongPress The function to be called on long press event.
 * @param {ImageSourcePropType} icon The image to be displayed in the button, optional.
 * @param {boolean} disabled Whether or not the button can be pressed (changes appearance).
 * @param {boolean} allowOverflow Whether number of lines for the button text should cap at 1.
 * 
 * @params borderColor, backgroundColor, darkModeBackgroundColor, pressedColor, textColor
 * Overrides for the various aspects of the button coloring.
 */
export default function MenuButton({
  onPress,
  onLongPress,
  value,
  label,
  icon,
  disabled,
  allowOverflow,
  borderColor,
  backgroundColor,
  darkModeBackgroundColor,
  pressedColor,
  textColor
}) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressedState] = useState(false);

  // const [sound, setSound] = useState();
  // async function playSound() {
  //   const { sound } = await Audio.Sound.createAsync(require('../assets/audio/button.wav'));
  //   setSound(sound);
  //   await sound.playAsync();
  // }

  // useEffect(() => {
  //   return sound ? () => { sound.unloadAsync(); } : undefined;
  // }, [sound]);

  // This ensures that onPress is optional.
  const pressedFn = () => {
    if (!!onPress) {
      onPress(value);
      // if (playAudio) { playSound(); }
    }
  }

  // This ensures that onLongPress is optional, and gives
  // the user visual feedback when it occurs.
  const longPressedFn = () => {
    setPressedState(true);
    if (!!onLongPress) {
      onLongPress(value);
      // if (playAudio) { playSound(); }
    }
  }

  return (
    <Pressable style={styles.body(
      !!label,
      pressed,
      disabled,
      darkMode,
      borderColor ? borderColor : colors.MAIN_PURPLE,
      backgroundColor ? backgroundColor : colors.OFF_WHITE,
      darkModeBackgroundColor ? darkModeBackgroundColor : colors.MAIN_PURPLE_TRANSPARENT(0.1),
      pressedColor ? pressedColor : colors.MAIN_PURPLE_TRANSPARENT(0.3),
    )}
      onPress={pressedFn} onLongPress={longPressedFn}
      onPressIn={() => { setPressedState(!!onPress) }} onPressOut={() => { setPressedState(false) }}
      disabled={disabled} touchSoundDisabled={false} android_disableSound={false}>

      {(icon) && <Image style={styles.icon} source={icon} />}

      {!!label && <Text numberOfLines={allowOverflow ? 0 : 1} style={{
        ...styles.label, color: textColor ? textColor : colors.MIDDLE_PURPLE,
      }}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: (hasLabel, isPressed, isDisabled, darkMode, borderColor, bgColor, bgColorDarkMode, pressedColor) => ({
    borderWidth: 1,
    width: hasLabel ? "100%" : undefined,
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: hasLabel ? 17.5 : 15,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderColor: borderColor,
    backgroundColor: (isPressed) ? pressedColor :
      (darkMode) ? bgColorDarkMode : bgColor,
    opacity: (isDisabled) ? 0.5 : 1,
    transform: [{
      scale: isPressed ? 0.98 : 1,
    }],
  }),
  label: {
    textAlign: "center",
    fontSize: normalize(18),
    marginLeft: 15,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  }
});