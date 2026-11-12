import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TextInput, View } from "react-native";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";

export interface InputLineProps {
  label: string,
  value: string,
  onChange?: (newValue: string) => void,
  fullBorder?: boolean,
  disabled?: boolean,
  darkMode?: boolean,
  isSensitive?: boolean,
  filterPattern?: RegExp,
  doFilter?: boolean,
  doFlex?: boolean,
}

/**
 * InputLine is an augmentation of the basic TextInput that has
 * a fancy animation for the label.
 */
export default function InputLine({
  label,
  value,
  onChange,
  fullBorder,
  disabled,
  darkMode,
  isSensitive,
  filterPattern = /[^a-z0-9 ]/gi,
  doFilter = true,
  doFlex,
}: InputLineProps) {
  const [focused, setFocus] = useState(false);
  const raised = value !== "" || focused;
  const anim = useRef(new Animated.Value(raised ? 1 : 0)).current;

  useEffect(() => {
    // Native driver: the label only animates transform, so this never re-lays out
    // text on the JS thread (which made the label jitter and slowed typing).
    Animated.timing(anim, {
      toValue: raised ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [raised]);

  return (
    <View style={[
      styles.container,
      fullBorder && styles.fullBorderContainer,
      disabled && { borderColor: colors.DIM_GRAY_TRANSPARENT(0.1) },
      doFlex && { flex: 1, marginBottom: 0 },
    ]}>
      <Animated.Text
        style={[
          styles.label,
          fullBorder && styles.fullBorderLabel,
          {
            color: raised ? colors.DIM_GRAY_TRANSPARENT(0.8) : colors.DIM_GRAY_TRANSPARENT(0.5),
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, LABEL_RAISE] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, LABEL_SCALE] }) },
            ],
          },
        ]}
        allowFontScaling={false}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        style={[
          styles.input,
          {
            color: (darkMode) ? "#fff" : "#000",
            opacity: disabled ? 0.75 : 1,
          },
        ]}
        onChangeText={(newVal) => {
          // Matches and removes any non-alphanumeric characters (except space)
          const filtered = doFilter ? newVal.replace(filterPattern, "") : newVal;
          onChange!(filtered); // TextInput will be disabled if onChange is not provided
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        value={value}
        selectionColor={colors.DIM_GRAY}
        cursorColor={colors.DIM_GRAY}
        allowFontScaling={false}
        editable={!disabled && !!onChange}
        secureTextEntry={isSensitive}
      />
    </View>
  );
}

// Explicit geometry so iOS (whose TextInput has no default padding) and Android
// (whose TextInput does) lay out identically, and the label can be positioned
// from known values instead of percentages.
// Plain points rather than normalize(): it subtracts a flat amount on iOS, which
// collapses small values like these.
const INPUT_HEIGHT = 26;
const TOP_SPACE = 16; // Room above the input for the raised label.
const TEXT_INSET = 6;
const LABEL_FONT_SIZE = 14;
const LABEL_SCALE = 10 / 14;
// Moves the label's center from the input's center to the middle of TOP_SPACE.
const LABEL_RAISE = -(TOP_SPACE / 2 + INPUT_HEIGHT / 2);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingTop: TOP_SPACE,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.3),
    marginBottom: 7.5,
  },
  fullBorderContainer: {
    paddingBottom: normalize(10),
    paddingHorizontal: normalize(12),
    borderWidth: 1,
    borderRadius: normalize(8),
  },
  label: {
    position: "absolute",
    top: TOP_SPACE,
    left: TEXT_INSET,
    height: INPUT_HEIGHT,
    lineHeight: INPUT_HEIGHT,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    transformOrigin: "left center", // Shrink toward the left edge, not the center.
  },
  fullBorderLabel: {
    left: normalize(12) + TEXT_INSET,
  },
  input: {
    width: "100%",
    height: INPUT_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: TEXT_INSET,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
});
