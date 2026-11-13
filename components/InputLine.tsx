import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../Theme";

export interface InputLineProps {
  label: string,
  value: string,
  onChange?: (newValue: string) => void,
  fullBorder?: boolean, // Kept for compatibility: every field is outlined now.
  disabled?: boolean,
  darkMode?: boolean,
  isSensitive?: boolean,
  filterPattern?: RegExp,
  doFilter?: boolean,
  doFlex?: boolean,
}

/**
 * An outlined text field. The label rests inside the field and, when focused or
 * filled, shrinks onto the top border, which opens a gap behind it (so it works on
 * any background). The gap is drawn with the outline's dash pattern.
 */
export default function InputLine({
  label,
  value,
  onChange,
  disabled,
  darkMode,
  isSensitive,
  filterPattern = /[^a-z0-9 ]/gi,
  doFilter = true,
  doFlex,
}: InputLineProps) {
  const [focused, setFocus] = useState(false);
  const raised = value !== "" || focused;
  const labelAnim = useRef(new Animated.Value(raised ? 1 : 0)).current;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    Animated.timing(labelAnim, { toValue: raised ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [raised]);

  const borderColor = disabled ? colors.DIM_GRAY_TRANSPARENT(0.1) :
    focused ? colors.DIM_GRAY_TRANSPARENT(0.7) : colors.DIM_GRAY_TRANSPARENT(0.3);

  // The outline: a rounded rect drawn as one path that starts just after the label's
  // gap on the top edge, goes clockwise, and stops just before it.
  const outline = outlinePath(size.width, size.height, raised ? labelWidth * LABEL_SCALE + 2 * GAP_PADDING : 0);

  return (
    <View
      style={[styles.container, doFlex && { flex: 1, marginBottom: 0 }]}
      onLayout={(event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size.width > 0 && <Svg width={size.width} height={size.height} style={styles.outline} pointerEvents="none">
        <Path d={outline} fill="none" stroke={borderColor} strokeWidth={BORDER} />
      </Svg>}

      <Animated.Text
        onLayout={(event: LayoutChangeEvent) => setLabelWidth(event.nativeEvent.layout.width)}
        style={[
          styles.label,
          {
            color: raised ? colors.DIM_GRAY_TRANSPARENT(0.85) : colors.DIM_GRAY_TRANSPARENT(0.5),
            transform: [
              { translateY: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, LABEL_RAISE] }) },
              { scale: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [1, LABEL_SCALE] }) },
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

function outlinePath(width: number, height: number, gap: number) {
  const o = BORDER / 2; // Keep the stroke inside the view.
  const right = width - o, bottom = height - o, r = RADIUS;
  const gapStart = PADDING_H - GAP_PADDING;
  const gapEnd = gapStart + gap;
  return [
    `M ${gapEnd} ${o}`,
    `H ${right - r}`, `A ${r} ${r} 0 0 1 ${right} ${o + r}`,
    `V ${bottom - r}`, `A ${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H ${o + r}`, `A ${r} ${r} 0 0 1 ${o} ${bottom - r}`,
    `V ${o + r}`, `A ${r} ${r} 0 0 1 ${o + r} ${o}`,
    `H ${gapStart}`,
  ].join(" ");
}

// Explicit geometry so iOS (whose TextInput has no default padding) and Android
// (whose TextInput does) lay out identically, and the label math stays exact.
const INPUT_HEIGHT = 24;
const PADDING_V = 11; // Above and below the input, inside the outline.
const PADDING_H = 16;
const RADIUS = 8;
const BORDER = 1;
const GAP_PADDING = 4; // Space between the raised label and the line on each side.
const LABEL_FONT_SIZE = 14;
const LABEL_SCALE = 11 / 14;
// Moves the label's center from the input's center onto the top border.
const LABEL_RAISE = -(PADDING_V + INPUT_HEIGHT / 2);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: PADDING_V,
    paddingHorizontal: PADDING_H,
    marginTop: 8, // Room for the half of the raised label above the line.
    marginBottom: 10,
  },
  outline: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  label: {
    position: "absolute",
    top: PADDING_V,
    left: PADDING_H,
    height: INPUT_HEIGHT,
    lineHeight: INPUT_HEIGHT,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    transformOrigin: "left center", // Shrink toward the left edge, not the center.
  },
  input: {
    width: "100%",
    height: INPUT_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: LABEL_FONT_SIZE,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
});
