import { View, Animated, Text, StyleSheet, TextInput } from 'react-native';
import React, { useRef, useEffect } from "react";
import { colors } from '../Theme';

/**
 * InputLine is an augmentation of the basic TextInput that has
 * a fancy animation for the label.
 * 
 * REQUIRED:
 * @param {string} label The label to fill the TextInput when empty and slide up when typing.
 * @param {any} value The value of the TextInput.
 * @param {Function} changeCallback The callback to use when the value inside is changed.
 * @param {boolean} darkMode Whether or not darkMode is enabled.
 */
export default function InputLine({ label, value, changeCallback, darkMode }) {
  const anim = useRef(new Animated.Value(0)).current;

  function handleAnim(focused) {
    const end = (value !== "" || focused) ? 1 : 0;
    Animated.timing(anim, {
      toValue: end,
      duration: 250,
      useNativeDriver: false, // otherwise fontSize not animatable
    }).start();
  }

  useEffect(() => {
    const end = (value !== "") ? 1 : 0;
    Animated.timing(anim, {
      toValue: end,
      duration: 250,
      useNativeDriver: false, // otherwise fontSize not animatable
    }).start();
  }, [value]); // so that on unmount the animation "state" isn't lost

  return (
    <View style={{
      ...styles.container,
      borderBottomColor: colors.MAIN_COLOR,
    }}>
      <Animated.Text style={styles.label(anim)}>
        {label}
      </Animated.Text>
      <Animated.View style={styles.inputContainer(anim)}>
        <TextInput
          style={styles.input(darkMode)}
          onChangeText={(newVal) => {
            handleAnim(true);
            changeCallback(newVal);
          }}
          onFocus={() => { handleAnim(true); }}
          onBlur={() => { handleAnim(false); }}
          value={value}
          cursorColor={colors.MAIN_COLOR}
          maxLength={14}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  label: (anim) => ({
    position: "absolute",
    top: "50%",
    left: 0,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.LIGHT_WALL, colors.DARK_WALL],
    }),
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -7],
      }),
    }],
    fontSize: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [14, 10],
    }),
  }),
  inputContainer: (anim) => ({
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 5],
      }),
    }],
  }),
  input: (darkMode) => ({
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    width: "100%",
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
});