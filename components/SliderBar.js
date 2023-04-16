import { View, Animated, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import React, { useEffect, useState } from "react";
import { colors } from '../Theme';

const win = Dimensions.get('window');
const barWidth = win.width / 2;

/**
 * InputLine is an augmentation of the basic TextInput that has
 * a fancy animation for the label.
 * 
 * REQUIRED:
 * @param {string} label The label to above the slider bar.
 * @param {string} units A string to be displayed by the value (e.g. "%", "px", or "" if none desired)
 * @param {number} value The current value of the slider.
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Function} changeCallback The callback to use when the value inside is changed.
 * 
 * OPTIONAL:
 * @params mainColor, knobColor
 * Overrides for the various colors of the slider bar.
 */
export default function SliderBar({
  label,
  units,
  value,
  minValue, maxValue,
  changeCallback,
  mainColor,
  knobColor,
}) {
  const [pressed, setPressed] = useState(false);
  const [movedAmount, setMovedAmount] = useState(value);

  function calcOffsetFromValue() {
    let offset = barWidth * ((value - minValue) / (maxValue - minValue));
    offset = Math.min(barWidth, Math.max(0, offset));
    return offset;
  }

  function onGestureMove(evt, gestureState) {
    setMovedAmount(gestureState.vx);
  }

  useEffect(() => {
    if (pressed) {
      const sensitivity = 25;
      const newValue = Math.max(minValue, Math.min(maxValue, Math.round(value + (movedAmount * sensitivity))))
      changeCallback(newValue);
    }
  }, [movedAmount]);

  const panResponder = React.useRef(
    PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => { setPressed(true) },
      onPanResponderMove: onGestureMove,
      onPanResponderRelease: () => { setPressed(false) },
      onPanResponderTerminate: () => { setPressed(false) },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.text(mainColor)}>{label}</Text>
        <Text style={styles.text(mainColor)}>{value}{units}</Text>
      </View>
      <View style={styles.bar(mainColor)}>
        <Animated.View style={styles.slider(
          calcOffsetFromValue(),
          pressed,
          mainColor,
          knobColor,
        )}></Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: barWidth,
    paddingTop: 5,
    paddingBottom: 15,
  },
  bar: (color) => ({
    width: "100%",
    height: 3,
    borderRadius: 3,
    backgroundColor: color,
  }),
  text: (color) => ({
    marginBottom: 10,
    color: color,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  slider: (xPos, pressed, color, fillColor) => ({
    position: "absolute",
    top: (pressed) ? -9 : -6,
    left: xPos - ((pressed) ? 9 : 6),
    height: (pressed) ? 21 : 15,
    width: (pressed) ? 21 : 15,
    borderRadius: (pressed) ? 11 : 7,
    borderWidth: 1,
    borderColor: color,
    backgroundColor: fillColor,
  }),

  // transform: [{
  //   translateY: anim.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: [0, -7],
  //   }),
  // }],
});