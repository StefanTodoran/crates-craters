import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";

interface Props {
  coins: number,
  maxCoins: number,
  keys: number,
}

export default function Inventory({ coins, maxCoins, keys }: Props) {
  const win = useWindowDimensions();
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
  const prevKeys = useRef(0);
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
  const displayKeys = Math.max(prevKeys.current, keys);

  for (let i = 0; i < displayKeys; i++) {
    // If it is the last key and # of keys changed, animate it. Otherwise set animated to
    // one meaning not animated, since it is terminal animation value.
    const animated = (i + 1 === displayKeys && prevKeys.current !== keys) ? keysAnim : 1;
    inventory.push(<Animated.Image key={i} source={graphics.KEY} style={[styles.icon, { transform: [{ scale: animated }], marginRight: -5 }]} />)
  }
  // END KEY ANIMATION
  // =================

  return (
    <View style={[styles.inventory, { width: win.width * 0.9 }]}>
      <View style={styles.row}>
        {inventory}
      </View>
      {/* Hidden, not removed, on levels without coins so the layout doesn't change. */}
      <View style={[styles.row, maxCoins === 0 && { opacity: 0 }]}>
        <Animated.Text allowFontScaling={false} style={[styles.coinsText, { opacity: coinsAnim }]}>{coins}</Animated.Text>
        <Animated.Text allowFontScaling={false} style={styles.maxCoinsText}>/{maxCoins}</Animated.Text>
        <Animated.Image style={[styles.icon, { transform: [{ scale: coinsAnim }] }]} source={graphics.COIN} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inventory: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: normalize(10),
  },
  coinsText: {
    color: colors.DIM_GRAY,
    fontSize: normalize(20),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
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
  icon: {
    height: normalize(32),
    width: normalize(32),
  },
});