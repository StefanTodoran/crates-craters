import { Pressable, Text, Image, ImageSourcePropType, StyleSheet } from "react-native";
import React, { useContext, useState } from "react";
import { Theme, purpleTheme } from "../Theme";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";

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

  const longPressedFn = () => {
    setPressedState(true); // To give visual feedback even for long press only buttons.
    if (!!onLongPress) onLongPress();
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
      onPress={onPress}
      onLongPress={longPressedFn}
      onPressIn={() => { setPressedState(!!onPress) }}
      onPressOut={() => { setPressedState(false) }}
      disabled={disabled}
    >

      {(icon) && <Image style={styles.icon} source={icon} />}

      {!!label && <Text
        numberOfLines={allowOverflow ? undefined : 1}
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
    borderRadius: normalize(10),
    paddingLeft: normalize(15),
    paddingVertical: normalize(14),
    marginTop: normalize(15),
    marginHorizontal: normalize(5),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    textAlign: "center",
    fontSize: normalize(16),
    marginLeft: normalize(16),
    // textTransform: "uppercase",
    fontFamily: "Montserrat-Medium",
    letterSpacing: 0.25,
    fontWeight: "bold",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  }
});