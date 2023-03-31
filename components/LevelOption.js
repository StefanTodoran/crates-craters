import { Text, StyleSheet } from 'react-native';
import React from "react";
import MenuButton from './MenuButton';
import { colors, graphics } from '../Theme';
import { normalize } from '../TextStyles';

/**
 * LevelOption is a basic component for use in LevelSelect.js which
 * contains a MenuButton as well as some text and other logic.
 * 
 * REQUIRED: (if you pass level)
 * @param {Function} onPress Function to be called when pressed.
 * @param {any} value The value to pass to the onPress callback.
 * 
 * OPTIONAL:
 * @param {LevelObj} level The level object to populate the option with.
 */
export default function LevelOption({ onPress, value, level }) {
  if (level) {
    return (
      <MenuButton onPress={onPress} value={value} label={level.name}
        icon={level.designer === "default" ? graphics.CRATE : graphics.CRATER} 
        children={
          <Text style={styles.number()}>{value + 1}</Text>
        } />
    );
  } else {
    return ( // We still give it an icon so it is the right size
      <MenuButton icon={graphics.CRATE} invisible />
    );
  }
}

const styles = StyleSheet.create({
  number: () => ({
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: normalize(14),
    color: colors.OFF_WHITE,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  }),
});