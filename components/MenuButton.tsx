import { Pressable, Text, Image, ImageSourcePropType, StyleSheet } from "react-native";
import React, { useContext, useState } from "react";
import { Theme, purpleTheme } from "../Theme";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
// import { Audio } from "expo-av";

interface Props {
  label?: string, // The text to be displayed in the button.
  onPress?: () => void, // The function to be called on press event.
  onLongPress?: () => void, // The function to be called on long press event.
  icon?: ImageSourcePropType, // The image to be displayed in the button.
  disabled?: boolean, // Whether or not the button can be pressed (changes appearance).
  allowOverflow?: boolean, // Whether number of lines for the button text should cap at 1.
  theme?: Theme,
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
  theme,
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

  // This ensures that onPress is optional. TODO: does this actually do anything?
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

  const useTheme = theme || purpleTheme;
  const backgroundColor = darkMode ? useTheme.MAIN_TRANSPARENT(0.1) : useTheme.OFF_WHITE;

  return (
    <Pressable style={[
      styles.body,
      {
        width: label ? "100%" : undefined,
        paddingRight: label ? normalize(17.5) : normalize(15),
        borderColor: useTheme.MAIN_COLOR,
        backgroundColor: (pressed) ? useTheme.MAIN_TRANSPARENT(0.3) : backgroundColor,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: (disabled) ? 0.5 : 1,
      }
    ]}
      onPress={pressedFn}
      onLongPress={longPressedFn}
      onPressIn={() => { setPressedState(!!onPress) }}
      onPressOut={() => { setPressedState(false) }}
      disabled={disabled}
      // @ts-expect-error
      touchSoundDisabled={false}
      android_disableSound={false}>

      {(icon) && <Image style={styles.icon} source={icon} />}

      {!!label && <Text
        numberOfLines={allowOverflow ? 0 : 1}
        allowFontScaling={false}
        style={[
          styles.label,
          { color: useTheme.MIDDLE_COLOR }
        ]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 15,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
});