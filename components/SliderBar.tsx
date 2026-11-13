import Slider from "@react-native-community/slider";
import { useContext } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { purpleTheme, Theme } from "../Theme";
import StepperArrow from "./StepperArrow";


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
 * A labelled native slider (UISlider on iOS, SeekBar on Android).
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
  const win = useWindowDimensions();
  const barWidth = win.width / 2;
  const useTheme = theme || purpleTheme;
  const mainColor = useTheme.MAIN_COLOR;

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
    <View style={[styles.container, { width: barWidth }]}>
      <View style={styles.row}>
        <Text allowFontScaling={false} style={[styles.text, { color: mainColor }]}>{label}</Text>
        <Text allowFontScaling={false} style={[styles.text, { color: mainColor }]}>{value}{units}</Text>
      </View>

      <View style={styles.barContainer}>
        <Slider
          style={styles.slider}
          value={value}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={stepSize > 0 ? stepSize : 1}
          onValueChange={changeCallback}
          minimumTrackTintColor={mainColor}
          maximumTrackTintColor={darkMode ? useTheme.DARK_COLOR : useTheme.LIGHT_COLOR}
          // iOS: the system's white thumb (off-white in dark mode). Android: the theme color.
          thumbTintColor={Platform.OS === "android" ? mainColor : darkMode ? useTheme.OFF_WHITE : undefined}
          accessibilityLabel={label}
        />

        {showSteppers && <>
          <StepperArrow color={mainColor!} onPress={stepperDecrement} flipped />
          <StepperArrow color={mainColor!} onPress={stepperIncrement} />
        </>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingTop: 5,
    paddingBottom: 10,
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
  slider: {
    flex: 1,
    height: 32,
  },
  text: {
    marginBottom: normalize(4),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    fontSize: normalize(15),
  },
});
