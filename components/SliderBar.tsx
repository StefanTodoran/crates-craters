import Slider from "@react-native-community/slider";
import { useContext, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { purpleTheme } from "../Theme";
import CustomSliderBar, { SliderBarProps } from "./CustomSliderBar";
import StepperArrow from "./StepperArrow";

/**
 * A labelled slider: the native UISlider on iOS, the app's custom slider on Android.
 * Props are documented on CustomSliderBar.
 */
export default function SliderBar(props: SliderBarProps) {
  return Platform.OS === "ios" ? <NativeSliderBar {...props} /> : <CustomSliderBar {...props} />;
}

function NativeSliderBar({
  label,
  units,
  value,
  minValue, maxValue,
  changeCallback,
  stepSize = 1,
  showSteppers,
  stepperWrapAround,
  theme,
  width,
  labelColor,
}: SliderBarProps) {
  const { darkMode } = useContext(GlobalContext);
  const win = useWindowDimensions();
  const barWidth = width ?? win.width / 2;
  const useTheme = theme || purpleTheme;
  const mainColor = useTheme.MAIN_COLOR;

  // The native slider applies `value` before its range, and only sends props that differ
  // from its previous (or, for a recycled view, default) props, so a fresh slider clamped
  // its value to a stale range and started at one end. The first render therefore sends a
  // range that's sure to differ, and the second the real range and value: by then the
  // value always fits the range already applied. Hidden until then.
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);

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
        <Text allowFontScaling={false} style={[styles.text, { color: labelColor ?? mainColor }]}>{label}</Text>
        <Text allowFontScaling={false} style={[styles.text, { color: labelColor ?? mainColor }]}>{value}{units}</Text>
      </View>

      <View style={styles.barContainer}>
        <Slider
          style={[styles.slider, { opacity: settled ? 1 : 0 }]}
          value={settled ? value : minValue - 1}
          minimumValue={settled ? minValue : minValue - 1}
          maximumValue={settled ? maxValue : maxValue + 1}
          step={stepSize > 0 ? stepSize : 1}
          onValueChange={changeCallback}
          minimumTrackTintColor={mainColor}
          maximumTrackTintColor={darkMode ? useTheme.DARK_COLOR : useTheme.LIGHT_COLOR}
          thumbTintColor={darkMode ? useTheme.OFF_WHITE : undefined} // System thumb in light mode.
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
