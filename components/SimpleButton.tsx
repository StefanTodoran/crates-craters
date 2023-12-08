import { Pressable, Text, Image, StyleSheet, ImageSourcePropType } from "react-native";
import React, { useContext, useState } from "react";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { colors } from "../Theme";

interface Props {
  onPress?: () => void,
  text: string,
  icon?: ImageSourcePropType,
  disabled?: boolean,
  main?: boolean,
  wide?: boolean,
}

export default function SimpleButton({
  onPress,
  text,
  icon,
  disabled,
  main,
  wide,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressedState] = useState(false);

  return (
    <Pressable
      style={[
        styles.simpleButton,
        {
          borderColor: colors.MAIN_PURPLE,
          backgroundColor: darkMode ? "#000" : "#fff",
          paddingHorizontal: icon ? normalize(5) : normalize(25),
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.75 : (disabled ? 0.5 : 1),
        },
        main && { backgroundColor: colors.MAIN_PURPLE },
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
            color: main ? "#fff" : colors.MAIN_PURPLE,
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