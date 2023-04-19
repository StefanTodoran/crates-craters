import { StyleSheet, Dimensions, Image, Animated } from 'react-native';
import React, { useEffect, useRef } from "react";
import { Audio } from 'expo-av';
import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

export default function WinScreen({ darkMode }) {
  useEffect(() => {
    async function playSound() {
      const { sound } = await Audio.Sound.createAsync(require('../assets/audio/victory.wav'));
      await sound.playAsync();
    }
    // A useEffect hook must return a function, not a promise.
    playSound();

    return function unmountCleanUp() {
      if (sound) { sound.unloadAsync(); }
    }
  }, []);

  // Controls the modal fade in.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, []);

  // Controls the confetti particles' motion.
  const confettiAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    confettiAnim.setValue(0); // motion
    Animated.decay(confettiAnim, {
      velocity: 0.25,
      deceleration: 0.998,
      useNativeDriver: true
    }).start();
  }, []);

  function randomInt(max) {
    return Math.floor(Math.random() * max);
  }
  function randomIcon() {
    const chance = randomInt(7);
    if (chance === 0) { return graphics.FLAG }
    if (chance === 1) { return graphics.CRATE }
    if (chance > 1 && chance < 5) { return graphics.COIN }
    if (chance > 4 && chance < 8) { return graphics.KEY }
  }

  const confetti = [];
  for (let i = 0; i < 20; i++) {
    // Distribution should be -0.5 <= vel <= 0.5
    const velX = (Math.random() - 0.5) * 3;
    const velY = Math.random() - 0.5;
    const rotate = randomInt(10);
    const icon = randomIcon();

    confetti.push(<Animated.Image
      key={`confetti<${i}>`} source={icon}
      style={styles.confetti(confettiAnim, velX, velY, rotate)}
    />);
  }

  return (
    <Animated.View style={{
      ...styles.modal,
      opacity: fadeAnim,
      backgroundColor: (darkMode) ? colors.NEAR_BLACK_TRANSPARENT(0.95) : "rgba(255, 255, 255, 0.9)",
    }}>
      <Image style={styles.banner} source={graphics.WIN_BANNER} />
      {confetti}
    </Animated.View>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: sizeFromWidthPercent(0.8, 145, 600)[0],
    height: sizeFromWidthPercent(0.8, 145, 600)[1],
  },
  confetti: (anim, velX, velY, rotate) => ({
    position: "absolute",
    height: 28,
    width: 28,
    opacity: 0.25,

    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, velY],
        })
      },
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, velX],
        })
      },
      {
        rotate: anim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", `${rotate}deg`],
        })
      },
    ],
  }),
});