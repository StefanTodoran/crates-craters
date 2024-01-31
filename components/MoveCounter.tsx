import { StyleSheet, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";

interface Props {
  moveCount: number,
}

export default function MoveCounter({ moveCount }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, duration: number) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: duration,
      useNativeDriver: true
    }).start();
  }

  useEffect(() => {
    setAnimTo(moveCount ? 1 : 0, moveCount ? 500 : 150);
  }, [moveCount]);


  const label = (moveCount !== 1) ? " moves" : " move";

  return (
    <Animated.Text style={styles.moveCount(anim)}>{moveCount}{label}</Animated.Text>
  );
}

const styles = StyleSheet.create<any>({
  moveCount: (anim: Animated.Value) => ({
    color: colors.DIM_GRAY,
    fontSize: normalize(16),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    marginLeft: normalize(10),
    opacity: anim,
  }),
});