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
}: InputLineProps) {
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
    <View style={[styles.container, fullBorder && styles.fullBorderContainer, disabled && {borderColor: colors.DIM_GRAY_TRANSPARENT(0.1)}]}>
      <Animated.Text style={[styles.label(anim), fullBorder && styles.fullBorderLabel]} allowFontScaling={false}>
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
            { 
              color: (darkMode) ? "#fff" : "#000", 
              opacity: disabled ? 0.75 : 1,
            },
          ]}
          onChangeText={(newVal) => {
            setFocus(true);
            // Matches and removes any non-alphanumeric characters (except space)
            const filtered = doFilter ? newVal.replace(filterPattern, "") : newVal;
            onChange!(filtered); // TextInput will be disabled if onChange is not provided
          }}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          value={value}
          selectionColor={colors.DIM_GRAY}
          cursorColor={colors.DIM_GRAY}
          maxLength={24}
          allowFontScaling={false}
          editable={!disabled && !!onChange}
          secureTextEntry={isSensitive}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    position: "relative",
    paddingTop: normalize(12.5),
    paddingBottom: normalize(7.5),
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.3),
    marginBottom: 7.5,
  },
  fullBorderContainer: {
    paddingTop: normalize(12),
    paddingBottom: normalize(12),
    paddingHorizontal: normalize(12),
    borderWidth: 1,
    borderRadius: normalize(8),
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
  fullBorderLabel: {
    left: normalize(12),
  },
  input: {
    width: "100%",
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
});