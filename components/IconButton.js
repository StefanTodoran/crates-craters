import { Pressable, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors } from '../Theme';
import { GlobalContext } from '../GlobalContext';
const win = Dimensions.get('window');

export default function IconButton({ onPress, source }) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

  const [pressed, setPressedState] = useState(false);
  const [sound, setSound] = useState();
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/button.wav'));
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // This ensures that onPress is optional.
  const pressedFn = () => {
    if (!!onPress) {
      onPress();
      // if (playAudio) { playSound(); }
    }
  }

  return (
    <Pressable onPress={pressedFn} style={{
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
    width: sizeFromWidthPercent(0.1, 100, 100)[0],
    height: sizeFromWidthPercent(0.1, 100, 100)[1],
  },
});