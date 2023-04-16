import { View, Animated, Text, StyleSheet, TextInput } from 'react-native';
import React, { useRef, useEffect, useState } from "react";
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
  const [focused, setFocus] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const end = (value !== "" || focused) ? 1 : 0;
    Animated.timing(anim, {
      toValue: end,
      duration: 250,
      useNativeDriver: false, // otherwise fontSize not animatable
    }).start();
  }, [value, focused]); // so that on unmount the animation "state" isn't lost

  return (
    <View style={{
      ...styles.container,
      borderBottomColor: colors.MAIN_PURPLE,
    }}>
      <Animated.Text style={styles.label(anim)}>
        {label}
      </Animated.Text>
      <Animated.View style={styles.inputContainer(anim)}>
        <TextInput
          style={styles.input(darkMode)}
          onChangeText={(newVal) => {
            setFocus(true);
            // Matches and removes any non-alphanumeric characters (except space)
            const filtered = newVal.replace(/[^a-z0-9 ]/gi, '');
            changeCallback(filtered);
          }}
          onFocus={() => { setFocus(true); }}
          onBlur={() => { setFocus(false); }}
          value={value}
          selectionColor={colors.MAIN_PURPLE}
          cursorColor={colors.MAIN_PURPLE}
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
      outputRange: [colors.MAIN_PURPLE_TRANSPARENT(0.5), colors.MAIN_PURPLE_TRANSPARENT(0.8)],
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
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
    width: "100%",
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
});