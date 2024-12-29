import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, GestureResponderEvent, PanResponder, PanResponderGestureState, StyleSheet, Text, View } from "react-native";
import { normalize } from "../TextStyles";
import StepperArrow from "./StepperArrow";

const win = Dimensions.get("window");
const barWidth = win.width / 2;
const sensitivityDampen = win.width / 40;

interface Props {
  label: string,
  units: string,
  value: number,
  minValue: number,
  maxValue: number,
  changeCallback: (newValue: number) => void,
  mainColor?: string,
  knobColor?: string,
  showSteppers?: boolean,
}

/** 
 * REQUIRED:
 * @param {string} label The label to above the slider bar.
 * @param {string} units A string to be displayed by the value (e.g. "%", "px", or "" if none desired)
 * @param {number} value The current value of the slider.
 * @param {number} minValue
 * @param {number} maxValue
 * @param {Function} changeCallback The callback to use when the value inside is changed.
 * @param {boolean} showSteppers
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
  showSteppers,
}: Props) {
  const [pressed, setPressed] = useState(false);

  function calcOffsetFromValue() {
    let offset = barWidth * ((value - minValue) / (maxValue - minValue));
    offset = Math.min(barWidth, Math.max(0, offset));
    return offset;
  }

  const calcValueFromGesture = useRef((_dx: number) => value);
  useEffect(() => {
    calcValueFromGesture.current = (dx: number) => {
      // While this is just a magic number value that gave decent results, we
      // base this on the range since larger ranges require higher sensitivity.
      const sensitivity = (maxValue - minValue) / sensitivityDampen;
      // const sensitivity = (maxValue - minValue) / normalize(10);

      const newValue = Math.max(minValue, Math.min(maxValue, Math.round(value + (dx * sensitivity))));
      return newValue;
    };
  }, [value, minValue, maxValue]);

  function onGestureMove(_evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    const newValue = calcValueFromGesture.current(gestureState.vx);
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
          <StepperArrow color={mainColor!} onPress={() => changeCallback(Math.max(value - 1, minValue))} flipped />
          <StepperArrow color={mainColor!} onPress={() => changeCallback(Math.min(value + 1, maxValue))} />
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