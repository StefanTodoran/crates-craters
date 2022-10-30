import { View, StyleSheet, Dimensions, Image, Text, Animated } from 'react-native';
import React, { useState, useRef } from "react";

import key from '../assets/key.png';
import coin from '../assets/coin.png';
import Colors from '../Colors';
const win = Dimensions.get('window');

export default function Inventory({ coins, maxCoins, keys }) {
  const inventory = [];
  for (let i = 0; i < keys; i++) {
    inventory.push(<Image source={key} style={styles.icon}/>)
  }

  return (
    <View style={styles.inventory}>
      <View style={styles.row}>
        {inventory}
      </View>
      <View style={styles.row}>
        <Text style={styles.text}>{coins}/{maxCoins}</Text>
        <Image style={styles.icon} source={coin}/>
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
  text: {
    color: Colors.MAIN_BLUE,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    height: 32,
    width: 32,
  }
});