import { Pressable, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useState } from "react";
import Colors from '../Colors';
const win = Dimensions.get('window');

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * REQUIRED:
 * @param {Function} onPress The function to be called on press event.
 * @param {any} value The value to be passed to the onPress function.
 * @param {string} label The text to be displayed in the button.
 * @param {number} width The width the button should have, defaults to 50% of the view width.
 * @param {boolean} invisible If true, the button is completely invisible (opacity of zero).
 * OPTIONAL:
 * @param {ImageSourcePropType} icon The image to be displayed in the button, optional.
 */
export default function MenuButton({ onPress, value, label, icon, width, invisible }) {
  const [pressed, setPressedState] = useState(false);
  
  const pressedFn = () => {
    onPress(value);
  }

  const bodyWidth = (width) ? width : win.width / 2;

  return (
    <Pressable style={{
      ...styles.body,
      width: bodyWidth,
      backgroundColor: (pressed) ? Colors.MAIN_COLOR_TRANSPARENT : "#00000000",
      opacity: (invisible) ? 0 : 1,
    }} onPress={pressedFn} onPressIn={() => { setPressedState(true) }} onPressOut={() => { setPressedState(false) }}>
      {(icon) && <Image style={styles.icon} source={icon}/>}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    borderColor: Colors.MAIN_COLOR,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  label: {
    textAlign: "center",
    color: Colors.MAIN_COLOR,
    fontSize: 16,
    paddingRight: 5,
  },
  icon: {
    height: 30,
    width: 30,
  }
});