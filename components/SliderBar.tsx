import Slider from "@react-native-community/slider";
import { useContext } from "react";
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
}: SliderBarProps) {
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
