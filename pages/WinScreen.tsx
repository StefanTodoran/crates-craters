import { StyleSheet, Image, Animated } from "react-native";
import { useContext, useEffect, useRef } from "react";
import { Audio } from "expo-av";
import { graphics } from "../Theme";
import GlobalContext from "../GlobalContext";
import { sizeFromWidthPercent } from "../TextStyles";

export default function WinScreen() {
  const { darkMode, playAudio } = useContext(GlobalContext);

  useEffect(() => {
    let sound: Audio.Sound;
    async function playSound() {
      sound = (await Audio.Sound.createAsync(require('../assets/audio/victory.wav'))).sound;
      await sound.playAsync();
    }

    // A useEffect hook must return a function, not a promise.
    if (playAudio) playSound();

    return function unmountCleanUp() {
      if (sound) sound.unloadAsync();
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

  function randomInt(max: number) { return Math.floor(Math.random() * max); }

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
      key={i} source={icon}
      style={[
        styles.confetti,
        {
          transform: [
            {
              translateY: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, velY],
              })
            },
            {
              translateX: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, velX],
              })
            },
            {
              rotate: confettiAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", `${rotate}deg`],
              })
            },
          ]
        },
      ]}
    />);
  }

  return (
    <Animated.View style={{
      ...styles.modal,
      opacity: fadeAnim,
      backgroundColor: (darkMode) ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
    }}>
      <Image style={styles.banner} source={graphics.WIN_BANNER} />
      {confetti}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    width: sizeFromWidthPercent(80, 600, 145).width,
    height: sizeFromWidthPercent(80, 600, 145).height,
  },
  confetti: {
    position: "absolute",
    height: 28,
    width: 28,
    opacity: 0.25,
  },
});