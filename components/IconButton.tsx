import { Pressable, Text, Image, ImageSourcePropType, StyleSheet } from "react-native";
import React, { useState } from "react";
import { normalize } from "../TextStyles";

interface Props {
  icon: ImageSourcePropType, // The image to be displayed in the button.
  color: string,
  label?: string, // The text to be displayed in the button.
  onPress?: () => void, // The function to be called on press event.
  disabled?: boolean, // Whether or not the button can be pressed (changes appearance).
}

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * @params borderColor, backgroundColor, darkModeBackgroundColor, pressedColor, textColor
 * Overrides for the various aspects of the button coloring.
 */
export default function IconButton({
  icon,
  color,
  label,
  onPress,
  disabled,
}: Props) {
  const [pressed, setPressedState] = useState(false);

  return (
    <Pressable
      style={styles.body(pressed, disabled)}
      onPress={onPress}
      onPressIn={() => { setPressedState(!!onPress) }}
      onPressOut={() => { setPressedState(false) }}
      disabled={disabled}
      // @ts-expect-error
      touchSoundDisabled={false}
      android_disableSound={false}>

      {icon && <Image style={styles.icon} source={icon} />}

      {!!label &&
        <Text
          allowFontScaling={false}
          style={{
            ...styles.label, color: color,
          }}>
          {label}
        </Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create<any>({
  body: (isPressed: boolean, isDisabled: boolean) => ({
    marginTop: normalize(15),
    marginBottom: normalize(7.5),
    marginHorizontal: normalize(7.5),
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: (isDisabled) ? 0.5 : 1,
    transform: [{
      scale: isPressed ? 0.95 : 1,
    }],
  }),
  label: {
    textAlign: "center",
    fontSize: normalize(18),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  }
});