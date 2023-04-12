import { Pressable, Text, StyleSheet, Image } from 'react-native';
import React, { useContext, useState } from 'react';
import { colors } from '../Theme';
import TextStyles, { normalize } from '../TextStyles';
import { GlobalContext } from '../GlobalContext';

export default function SimpleButton({ onPress, text, icon, disabled }) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressedState] = useState(false);

  return (
    <Pressable style={styles.simpleButton(pressed, disabled)} onPress={() => {
      if (!disabled) {
        onPress(); // We do this as opposed to using the disable property
        // so we still capture the click event if disabled.
      }
    }} onPressIn={() => { setPressedState(!disabled) }} onPressOut={() => { setPressedState(false) }}>
      <Text style={[TextStyles.paragraph(darkMode), { marginBottom: 0 }]}>{text}</Text>
      {icon && <Image style={styles.bigIcon} source={icon} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  simpleButton: (pressed, disabled) => ({
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: normalize(5),
    paddingVertical: normalize(3),
    paddingHorizontal: normalize(10),
    borderWidth: 1,
    borderColor: colors.MAIN_COLOR_TRANSPARENT(0.5),
    borderRadius: normalize(10),
    backgroundColor: (pressed) ? colors.MAIN_COLOR_TRANSPARENT(0.2) : "#00000000",
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