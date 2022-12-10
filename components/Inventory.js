import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import React, { useEffect, useRef, useState } from "react";

import { colors, graphics } from '../Theme';
const win = Dimensions.get('window');

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
  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }
  const prevKeys = usePrevious(keys);

  const keysAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const startVal = (prevKeys < keys) ? 0 : 1;
    const endVal = (prevKeys < keys) ? 1 : 0;

    keysAnim.setValue(startVal);
    Animated.timing(keysAnim, {
      toValue: endVal,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, [keys]);

  const inventory = [];
  const displayKeys = (prevKeys > keys) ? prevKeys : keys;
  // We don't do Math.max(prevKeys, keys); because there is a possibility of NaN.
  for (let i = 0; i < displayKeys; i++) {
    // If it is the last key and # of keys changed, animate it. Otherwise set animated to
    // one meaning not animated, since it is terminal animation value.
    const animated = (i + 1 === displayKeys && prevKeys !== keys) ? keysAnim : 1;
    inventory.push(<Animated.Image key={`key<${i}>`} source={graphics.KEY} style={styles.icon(animated)} />)
  }
  // END KEY ANIMATION
  // =================

  return (
    <View style={styles.inventory}>
      <View style={styles.row}>
        {inventory}
      </View>
      <View style={styles.row}>
        <Animated.Text style={styles.coinsText(coinsAnim)}>{coins}</Animated.Text>
        <Animated.Text style={{
          color: colors.DARK_COLOR,
          fontSize: 10,
        }}>/{maxCoins}</Animated.Text>
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
    marginBottom: 10,
  },
  coinsText: (anim) => ({
    color: colors.MAIN_COLOR,
    fontSize: 18,
    opacity: anim,
  }),
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: (anim) => ({
    height: 32,
    width: 32,
    transform: [{
      scale: anim,
    }],
  }),
});