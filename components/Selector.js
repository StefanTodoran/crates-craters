import { Pressable, View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * REQUIRED:
 * @param {string} label The text to be displayed in the button.
 * @param {Function} onNext The function to be called when the next button is pressed.
 * @param {Function} onPrev The function to be called when the prev button is pressed.
 * OPTIONAL:
 * @param {ImageSourcePropType} icon The image to be displayed in the button, optional.
 * @param {boolean} disabled Whether or not the button can be pressed (changes appearance).
 */
export default function Selector({ label, onNext, onPrev, nextDisabled, prevDisabled }) {
  const [nextPressed, setNextPressed] = useState(false);
  const [prevPressed, setPrevPressed] = useState(false);
  const [sound, setSound] = useState();
  async function playSound() {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/button.wav'));
    setSound(sound);
    await sound.playAsync();
  }

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  return (
    <View style={styles.outerContainer}>
      <Pressable disabled={prevDisabled} touchSoundDisabled={true} onPress={() => {
        playSound();
        onPrev();
      }}
      onPressIn={() => {setPrevPressed(true)}} onPressOut={() => {setPrevPressed(false)}}>
        <Image style={styles.icon(prevPressed, prevDisabled)} source={graphics.LEFT_ICON} />
      </Pressable>
      <Text style={{
        width: win.width / 2,
        ...styles.label, color: colors.MAIN_COLOR,
      }}>{label}</Text>
      <Pressable disabled={nextDisabled} touchSoundDisabled={true} onPress={() => {
        playSound();
        onNext();
      }}
      onPressIn={() => {setNextPressed(true)}} onPressOut={() => {setNextPressed(false)}}>
        <Image style={styles.icon(nextPressed, nextDisabled)} source={graphics.RIGHT_ICON} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: win.width / 1.5,
  },
  label: {
    textAlign: "center",
    // color: colors.MAIN_COLOR, won't auto update here, so we do it in render funciton
    fontSize: 16,
    paddingRight: 5,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: (pressed, disabled) => ({
    height: 17.5,
    width: 30,
    opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
    transform: [{
      scale: pressed ? 1.25 : 1,
    }],
  }),
});