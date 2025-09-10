import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";

interface Props {
  moveCount: number,
  bestMoves?: number,
}

export default function MoveCounter({ moveCount, bestMoves }: Props) {
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


  const moveCountLabel = (moveCount !== 1) ? " moves" : " move";

  return (
    <View style={styles.row}>
      <Animated.Text style={[styles.moveCount, { opacity: anim }]}>{moveCount}{moveCountLabel}</Animated.Text>
      {bestMoves !== undefined && <Animated.Text style={styles.bestCount}>{bestMoves} best</Animated.Text>}
    </View>
  );
}

const styles = StyleSheet.create<any>({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moveCount: {
    color: colors.DIM_GRAY,
    fontSize: normalize(16),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    marginHorizontal: normalize(10),
  },
  bestCount: {
    color: colors.DIM_GRAY,
    fontSize: normalize(14),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    marginHorizontal: normalize(10),
  },
});