import { Pressable, Text, StyleSheet, Image } from "react-native";
import React, { useContext, useState } from 'react';
import { colors } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";
import { GlobalContext } from "../GlobalContext";

export default function SimpleButton({ onPress, text, icon, disabled, main, wide }) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressedState] = useState(false);

  const fillColor = (darkMode) ? colors.MAIN_PURPLE_TRANSPARENT(0.8) : colors.MAIN_PURPLE;
  const pressedFillColor = (darkMode) ? colors.MAIN_PURPLE : colors.MAIN_PURPLE_TRANSPARENT(0.8);

  return (
    <Pressable style={[styles.simpleButton(pressed, disabled, !!icon), main && {
      borderColor: (pressed) ? pressedFillColor : fillColor,
      backgroundColor: (pressed) ? pressedFillColor : fillColor,
    }, wide && { paddingHorizontal: normalize(50) }]} onPress={() => {
      if (!disabled) {
        onPress(); // We do this as opposed to using the disable property
        // so we still capture the click event if disabled.
      }
    }} onPressIn={() => { setPressedState(!disabled) }} onPressOut={() => { setPressedState(false) }}>
      {icon && <Image style={styles.bigIcon} source={icon} />}
      <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), {
        marginBottom: 0,
        marginLeft: icon ? normalize(10) : 0,
        color: main ? "white" : colors.MAIN_PURPLE,
        fontSize: normalize(14),
      }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  simpleButton: (pressed, disabled, icon) => ({
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: "space-between",
    marginVertical: normalize(5),
    paddingVertical: normalize(3),
    paddingHorizontal: icon ? normalize(5) : normalize(25),
    borderWidth: 1,
    borderColor: colors.MAIN_PURPLE_TRANSPARENT(0.5),
    borderRadius: normalize(10),
    backgroundColor: (pressed) ? colors.MAIN_PURPLE_TRANSPARENT(0.2) : "#00000000",
    transform: [{
      scale: pressed ? 0.98 : 1,
    }],
    opacity: disabled ? 0.5 : 1,
  }),
  bigIcon: {
    height: normalize(35),
    width: normalize(35),
  },
});