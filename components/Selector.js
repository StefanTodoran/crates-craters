import { Pressable, View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { colors, graphics } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import { normalize } from '../TextStyles';
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
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

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
        // if (playAudio) { playSound(); }
        onPrev();
      }} hitSlop={15}
      onPressIn={() => {setPrevPressed(true)}} onPressOut={() => {setPrevPressed(false)}}>
        <Image style={styles.icon(prevPressed, prevDisabled)} source={graphics.LEFT_ICON} />
      </Pressable>
      <Text style={{
        width: win.width / 2,
        ...styles.label, color: colors.MAIN_COLOR,
      }}>{label}</Text>
      <Pressable disabled={nextDisabled} touchSoundDisabled={true} onPress={() => {
        // if (playAudio) { playSound(); }
        onNext();
      }} hitSlop={15}
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
    fontSize: normalize(18),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    paddingRight: 5,
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