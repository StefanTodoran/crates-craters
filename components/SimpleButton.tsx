import { Pressable, Text, Image, StyleSheet, ImageSourcePropType } from "react-native";
import React, { useContext, useState } from "react";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { Theme, purpleTheme } from "../Theme";

interface Props {
  text: string,
  onPress?: () => void,
  icon?: ImageSourcePropType,
  disabled?: boolean,
  main?: boolean,
  wide?: boolean,
  theme?: Theme,
}

export default function SimpleButton({
  onPress,
  text,
  icon,
  disabled,
  main,
  wide,
  theme,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressedState] = useState(false);
  const useTheme = theme || purpleTheme;

  return (
    <Pressable
      style={[
        styles.simpleButton,
        {
          borderColor: useTheme.MAIN_COLOR,
          backgroundColor: darkMode ? "#000" : "#fff",
          paddingHorizontal: icon ? normalize(5) : normalize(25),
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.75 : (disabled ? 0.5 : 1),
        },
        main && { backgroundColor: useTheme.MAIN_COLOR },
        wide && { paddingHorizontal: normalize(50) },
      ]}
      onPress={() => {
        if (!disabled && onPress) onPress(); // We do this as opposed to using the disable property so we still capture the click event if disabled.
      }}
      onPressIn={() => setPressedState(!disabled)}
      onPressOut={() => setPressedState(false)}
    >
      {icon && <Image style={styles.bigIcon} source={icon} />}

      <Text
        allowFontScaling={false}
        style={[
          TextStyles.paragraph(darkMode),
          {
            marginBottom: 0,
            marginLeft: icon ? normalize(10) : 0,
            color: main ? "#fff" : useTheme.MAIN_COLOR,
            fontSize: normalize(15),
          }
        ]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  simpleButton: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    marginVertical: normalize(5),
    paddingVertical: normalize(3),
    borderWidth: 1,
    borderRadius: normalize(10),
  },
  bigIcon: {
    height: normalize(35),
    width: normalize(35),
  },
});