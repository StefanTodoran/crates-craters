import { Pressable, ImageSourcePropType, StyleSheet, Animated } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { normalize } from "../TextStyles";

interface Props {
  icon: ImageSourcePropType, // The image to be displayed in the button.
  color: string,
  label?: string, // The text to be displayed in the button.
  onPress?: () => void, // The function to be called on press event.
  active?: boolean,
  disabled?: boolean, // Whether or not the button can be pressed (changes appearance).
}

export default function IconButton({
  icon,
  color,
  label,
  onPress,
  active,
  disabled,
}: Props) {
  const [pressed, setPressedState] = useState(false);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 150,
      useNativeDriver: true
    }).start(callback);
  }

  useEffect(() => {
    setAnimTo(active ? 1 : 0);
  }, [active]);

  return (
    <Pressable
      style={[
        styles.body,
        {
          opacity: (disabled) ? 0.5 : 1,
          transform: [{
            scale: pressed ? 0.95 : 1,
          }],
        }
      ]}
      onPress={onPress}
      onPressIn={() => { setPressedState(!!onPress) }}
      onPressOut={() => { setPressedState(false) }}
      disabled={disabled}
      // @ts-expect-error
      touchSoundDisabled={false}
      android_disableSound={false} >

      {icon && <Animated.Image
        style={[
          styles.icon,
          {
            transform: [{
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            }],
          }
        ]}
        source={icon}
      />}

      {!!label &&
        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.label,
            {
              color: color,
              opacity: anim,
              transform: [{
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              }],
            }
          ]}>
          {label}
        </Animated.Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create<any>({
  body: {
    marginTop: normalize(15),
    marginBottom: normalize(7.5),
    marginHorizontal: normalize(7.5),
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
    fontSize: normalize(18),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  }
});