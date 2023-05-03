import { Pressable, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { colors } from '../Theme';
const win = Dimensions.get('window');

export default function IconButton({ onPress, source }) {
  const [pressed, setPressedState] = useState(false);

  // This ensures that onPress is optional.
  const pressedFn = () => {
    if (!!onPress) {
      onPress();
    }
  }

  return (
    <Pressable onPress={pressedFn} style={{
      padding: sizeFromWidthPercent(0.02, 100, 100)[0],
      borderRadius: sizeFromWidthPercent(0.02, 100, 100)[0],
      backgroundColor: pressed ? colors.MAIN_PURPLE_TRANSPARENT(0.1) : "#00000000",
      transform: [{
        scale: pressed ? 0.95 : 1,
      }],
    }} onPressIn={() => { setPressedState(!!onPress) }} onPressOut={() => { setPressedState(false) }}>
      <Image style={styles.icon} source={source} />
    </Pressable>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  icon: {
    width: sizeFromWidthPercent(0.09, 100, 100)[0],
    height: sizeFromWidthPercent(0.09, 100, 100)[1],
  },
});