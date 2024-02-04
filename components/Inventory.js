import { View, StyleSheet, Dimensions, Animated } from "react-native";
import React, { useEffect, useRef } from "react";

import { colors, graphics } from "../Theme";
import { normalize } from "../TextStyles";
const win = Dimensions.get("window");

export default function Inventory({ coins, maxCoins, keys }) {
  const coinsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    coinsAnim.setValue(0);
    Animated.timing(coinsAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [coins]);

  // =============
  // KEY ANIMATION
  const prevKeys = useRef();
  const keysAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const startVal = (prevKeys.current < keys) ? 0 : 1;
    const endVal = (prevKeys.current < keys) ? 1 : 0;

    keysAnim.setValue(startVal);
    Animated.timing(keysAnim, {
      toValue: endVal,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      prevKeys.current = keys;
    });
  }, [keys]);

  const inventory = [];
  const displayKeys = (prevKeys.current > keys) ? prevKeys.current : keys;
  // We don't do Math.max(prevKeys, keys); because there is a possibility of NaN.

  for (let i = 0; i < displayKeys; i++) {
    // If it is the last key and # of keys changed, animate it. Otherwise set animated to
    // one meaning not animated, since it is terminal animation value.
    const animated = (i + 1 === displayKeys && prevKeys.current !== keys) ? keysAnim : 1;
    inventory.push(<Animated.Image key={i} source={graphics.KEY} style={[styles.icon(animated), { marginRight: -5 }]} />)
  }
  // END KEY ANIMATION
  // =================

  return (
    <View style={styles.inventory}>
      <View style={styles.row}>
      {/* <View style={[styles.row, { marginLeft: 5 }]}> */}
        {inventory}
      </View>
      <View style={styles.row}>
        <Animated.Text allowFontScaling={false} style={styles.coinsText(coinsAnim)}>{coins}</Animated.Text>
        <Animated.Text allowFontScaling={false} style={styles.maxCoinsText}>/{maxCoins}</Animated.Text>
        <Animated.Image style={styles.icon(coinsAnim)} source={graphics.COIN} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inventory: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: win.width * 0.9,
    marginBottom: normalize(10),
  },
  coinsText: (anim) => ({
    color: colors.DIM_GRAY,
    fontSize: normalize(20),
    opacity: anim,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  maxCoinsText: {
    color: "#A7A2A9",
    fontSize: normalize(12),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: normalize(7),
    marginRight: normalize(6),
  },
  icon: (anim) => ({
    height: normalize(32),
    width: normalize(32),
    transform: [{
      scale: anim,
    }],
  }),
});