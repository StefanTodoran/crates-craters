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
      <MenuButton onPress={onPress} value={value} label={normalize(level.name)}
        icon={level.designer === "default" ? graphics.CRATE : graphics.CRATER} />
    );
  } else {
    return ( // We still give it an icon so it is the right size
      <MenuButton icon={graphics.CRATE} invisible />
    );
  }
}

function normalize(str) {
  return str.substring(0, 14).padStart(14);
}