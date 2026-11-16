import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, StyleSheet, TextInput, View } from "react-native";
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
 * filled, shrinks onto the top border while a gap opens in the border behind it (a
 * real gap, so it works on any background). Everything animates on the native driver.
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
  const [labelWidth, setLabelWidth] = useState(0);

  useEffect(() => {
    Animated.timing(labelAnim, { toValue: raised ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [raised]);

  const borderColor = disabled ? colors.DIM_GRAY_TRANSPARENT(0.1) :
    focused ? colors.DIM_GRAY_TRANSPARENT(0.7) : colors.DIM_GRAY_TRANSPARENT(0.3);

  const gap = labelWidth * LABEL_SCALE + 2 * GAP_PADDING;

  return (
    <View style={[styles.container, doFlex && { flex: 1, marginBottom: 0 }]}>
      {/* The outline, in pieces so the top edge can open: sides and bottom, the two
          rounded top corners, and the top edge between them. The top edge is a short
          stub before the label plus a line that slides right (clipped at the corner)
          to open the gap as the label rises into it. */}
      <View pointerEvents="none" style={[styles.sides, { borderColor }]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerLeft, { borderColor }]} />
      <View pointerEvents="none" style={[styles.corner, styles.cornerRight, { borderColor }]} />
      <View pointerEvents="none" style={styles.topEdge}>
        <View style={[styles.topStub, { backgroundColor: borderColor }]} />
        <Animated.View style={[
          styles.topLine,
          {
            backgroundColor: borderColor,
            transform: [{ translateX: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, gap] }) }],
          },
        ]} />
      </View>

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
/** Space above the outline for the raised label. Siblings in a row can match it to line up. */
export const INPUT_LABEL_ROOM = 8;
/** Height of the outlined box, for siblings that should match it. */
export const INPUT_FIELD_HEIGHT = 2 * PADDING_V + INPUT_HEIGHT;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: PADDING_V,
    paddingHorizontal: PADDING_H,
    marginTop: INPUT_LABEL_ROOM, // Room for the half of the raised label above the line.
    marginBottom: 10,
  },
  sides: {
    position: "absolute",
    top: RADIUS,
    left: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: BORDER,
    borderRightWidth: BORDER,
    borderBottomWidth: BORDER,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
  },
  corner: {
    position: "absolute",
    top: 0,
    width: RADIUS,
    height: RADIUS,
    borderTopWidth: BORDER,
  },
  cornerLeft: {
    left: 0,
    borderLeftWidth: BORDER,
    borderTopLeftRadius: RADIUS,
  },
  cornerRight: {
    right: 0,
    borderRightWidth: BORDER,
    borderTopRightRadius: RADIUS,
  },
  topEdge: {
    position: "absolute",
    top: 0,
    left: RADIUS,
    right: RADIUS,
    height: BORDER,
    overflow: "hidden",
  },
  topStub: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PADDING_H - GAP_PADDING - RADIUS,
    height: BORDER,
  },
  topLine: {
    position: "absolute",
    top: 0,
    left: PADDING_H - GAP_PADDING - RADIUS,
    right: 0,
    height: BORDER,
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
