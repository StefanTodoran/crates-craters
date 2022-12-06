import { View, Text, StyleSheet, Dimensions } from 'react-native';
import React from "react";
import MenuButton from './MenuButton';
import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

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
      <View style={styles.container}>
        {/* <Text style={styles.label}>{level.name}</Text> */}
        <MenuButton onPress={onPress} value={value} label={normalize(level.name)}
          icon={level.designer === "default" ? graphics.CRATE : graphics.CRATER} width={win.width * 0.4} />
      </View>
    );
  } else {
    return ( // We still give it an icon so it is the right size
      <MenuButton label={""} icon={graphics.CRATE} width={win.width * 0.4} invisible/>
    );
  }
}

function normalize(str) {
  return str.substring(0, 14).padStart(14);
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  label: {
    position: "absolute",
    left: "15%",
    color: colors.MAIN_COLOR,
  },
});