import { Pressable, Text, Image, ImageSourcePropType } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { Audio } from "expo-av";
import { colors } from "../Theme";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";

interface Props {
  label?: string, // The text to be displayed in the button.
  onPress?: () => void, // The function to be called on press event.
  onLongPress?: () => void, // The function to be called on long press event.
  icon?: ImageSourcePropType, // The image to be displayed in the button.
  disabled?: boolean, // Whether or not the button can be pressed (changes appearance).
  allowOverflow?: boolean, // Whether number of lines for the button text should cap at 1.
  borderColor?: string,
  backgroundColor?: string,
  darkModeBackgroundColor?: string,
  pressedColor?: string,
  textColor?: string,
}

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * @params borderColor, backgroundColor, darkModeBackgroundColor, pressedColor, textColor
 * Overrides for the various aspects of the button coloring.
 */
export default function MenuButton({
  onPress,
  onLongPress,
  label,
  icon,
  disabled,
  allowOverflow,
  borderColor,
  backgroundColor,
  darkModeBackgroundColor,
  pressedColor,
  textColor,
}: Props) {
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
      onPress();
      // if (playAudio) { playSound(); }
    }
  }

  // This ensures that onLongPress is optional, and gives
  // the user visual feedback when it occurs.
  const longPressedFn = () => {
    setPressedState(true);
    if (!!onLongPress) {
      onLongPress();
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
      onPress={pressedFn}
      onLongPress={longPressedFn}
      onPressIn={() => { setPressedState(!!onPress) }} 
      onPressOut={() => { setPressedState(false) }}
      disabled={disabled} 
      // @ts-expect-error
      touchSoundDisabled={false} 
      android_disableSound={false}>

      {(icon) && <Image style={styles.icon} source={icon} />}

      {!!label && <Text numberOfLines={allowOverflow ? 0 : 1} allowFontScaling={false} style={{
        ...styles.label, color: textColor ? textColor : colors.MIDDLE_PURPLE,
      }}>{label}</Text>}
    </Pressable>
  );
}

const styles: any = {
  body: (
    hasLabel: boolean,
    isPressed: boolean,
    isDisabled: boolean,
    darkMode: boolean,
    borderColor: string,
    bgColor: string,
    bgColorDarkMode: string,
    pressedColor: string,
  ) => ({
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
    fontSize: normalize(16),
    marginLeft: 15,
    // textTransform: "uppercase",
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  }
};