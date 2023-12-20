import { View, Animated, StyleSheet, TextInput } from "react-native";
import React, { useRef, useEffect, useState } from "react";
import { colors } from "../Theme";

interface Props {
  label: string,
  value: string,
  onChange: (newValue: string) => void,
  darkMode: boolean,
}

/**
 * InputLine is an augmentation of the basic TextInput that has
 * a fancy animation for the label.
 */
export default function InputLine({
  label,
  value,
  onChange,
  darkMode,
}: Props) {
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
    <View style={styles.container}>
      <Animated.Text style={styles.label(anim)} allowFontScaling={false}>
        {label}
      </Animated.Text>
      <Animated.View style={{
        transform: [{
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 5],
          }),
        }],
      }}>
        <TextInput
          style={[
            styles.input,
            { color: (darkMode) ? "#fff" : "#000" },
          ]}
          onChangeText={(newVal) => {
            setFocus(true);
            // Matches and removes any non-alphanumeric characters (except space)
            const filtered = newVal.replace(/[^a-z0-9 ]/gi, "");
            onChange(filtered);
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          value={value}
          selectionColor={colors.DIM_GRAY}
          cursorColor={colors.DIM_GRAY}
          maxLength={18}
          allowFontScaling={false}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    position: "relative",
    paddingTop: 12.5,
    paddingBottom: 7.5,
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.3),
    marginBottom: 7.5,
  },
  label: (anim: Animated.Value) => ({
    position: "absolute",
    top: "60%",
    left: 0,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.DIM_GRAY_TRANSPARENT(0.5), colors.DIM_GRAY_TRANSPARENT(0.8)],
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
  input: {
    width: "100%",
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
});