import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { purpleTheme, Theme } from "../Theme";
import StepperArrow from "./StepperArrow";

const win = Dimensions.get("window");
const barWidth = win.width / 2;
const leftGutterWidth = (win.width - barWidth) / 2;


interface Props {
  label: string,
  units: string,
  value: number,
  minValue: number,
  maxValue: number,
  changeCallback: (newValue: number) => void,
  stepSize?: number,
  showSteppers?: boolean,
  stepperWrapAround?: boolean,
  theme?: Theme,
}

/** 
 * REQUIRED:
 * @param {string} label The label to above the slider bar.
 * @param {string} units A string to be displayed by the value (e.g. "%", "px", or "" if none desired)
 * @param {number} value The current value of the slider.
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Function} changeCallback The callback to use when the value inside is changed.
 * @param {number} stepSize The increment to snap values to. Defaults to 1.
 * @param {boolean} showSteppers
 * @param {boolean} stepperWrapAround Whether to wrap around the min and max values when the steppers are pressed.
 */
export default function SliderBar({
  label,
  units,
  value,
  minValue, maxValue,
  changeCallback,
  stepSize = 1,
  showSteppers,
  stepperWrapAround,
  theme,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [pressed, setPressed] = useState(false);
  const useTheme = theme || purpleTheme;

  const mainColor = useTheme.MAIN_COLOR;
  const knobColor = darkMode ? useTheme.NEAR_BLACK : useTheme.OFF_WHITE;

  function calcOffsetFromValue() {
    let offset = barWidth * ((value - minValue) / (maxValue - minValue));
    offset = Math.min(barWidth, Math.max(0, offset));
    return offset;
  }

  const calcValueFromGesture = useRef((_gestureState: PanResponderGestureState) => value);
  useEffect(() => {
    calcValueFromGesture.current = (gestureState: PanResponderGestureState) => {
      const fractionalPos = (gestureState.moveX - leftGutterWidth) / barWidth;
      const newValue = fractionalPos * (maxValue - minValue) + minValue;
      const effectiveStep = stepSize > 0 ? stepSize : 1;
      const snappedValue = Math.round((newValue - minValue) / effectiveStep) * effectiveStep + minValue;
      const boundedNewValue = Math.max(minValue, Math.min(maxValue, snappedValue));
      return boundedNewValue;
    };
  }, [value, minValue, maxValue, stepSize]);

  function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    const newValue = calcValueFromGesture.current(gestureState);
    changeCallback(newValue);
  }

  const panResponder = useRef(
    PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => true,
      onShouldBlockNativeResponder: () => true,

      onPanResponderGrant: () => setPressed(true),
      onPanResponderMove: onGestureMove,
      onPanResponderRelease: () => setPressed(false),
      onPanResponderTerminate: () => setPressed(false),
    }),
  ).current;

  function stepperDecrement() {
    if (stepperWrapAround) {
      const newValue = value - stepSize;
      changeCallback(newValue >= minValue ? newValue : maxValue);
    } else {
      changeCallback(Math.max(value - stepSize, minValue));
    }
  }

  function stepperIncrement() {
    if (stepperWrapAround) {
      const newValue = value + stepSize;
      changeCallback(newValue <= maxValue ? newValue : minValue);
    } else {
      changeCallback(Math.min(value + stepSize, maxValue));
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text allowFontScaling={false} style={styles.text(mainColor)}>{label}</Text>
        <Text allowFontScaling={false} style={styles.text(mainColor)}>{value}{units}</Text>
      </View>

      <View style={styles.barContainer}>
        <View style={[styles.bar, { backgroundColor: mainColor }]} {...panResponder.panHandlers}>
          <Animated.View style={styles.slider(
            calcOffsetFromValue(),
            pressed,
            mainColor,
            knobColor,
          )}></Animated.View>
        </View>

        {showSteppers && <>
          <StepperArrow color={mainColor!} onPress={stepperDecrement} flipped />
          <StepperArrow color={mainColor!} onPress={stepperIncrement} />
        </>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    position: "relative",
    width: barWidth,
    paddingTop: 5,
    paddingBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  barContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    height: 3,
    borderRadius: 3,
  },
  text: (color: string) => ({
    marginBottom: normalize(10),
    color: color,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    fontSize: normalize(15),
  }),
  slider: (xPos: number, pressed: boolean, color: string, fillColor: string) => ({
    position: "absolute",
    top: (pressed) ? -9 : -6,
    left: xPos - 1 - ((pressed) ? 9 : 6),
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