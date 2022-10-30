import { Pressable, Text, StyleSheet, Image, Dimensions, Linking } from 'react-native';
import React, { useState } from "react";

const win = Dimensions.get('window');
const LOGO_GREEN = "#4F772D";

/**
 * PortfolioButton is just like the basic button type MenuButton but
 * specifically made to link to my portfolio and have a different color scheme.
 */
export default function PortfolioButton() {
  const [pressed, setPressedState] = useState(false);

  const pressedFn = () => {
    Linking.openURL("https://todoran.dev/");
  }

  return (
    <Pressable style={{
      ...styles.body,
      backgroundColor: (pressed) ? "#4F772D33" : "#00000000",
    }} onPress={pressedFn} onPressIn={() => { setPressedState(true) }} onPressOut={() => { setPressedState(false) }}>
      <Image style={styles.icon} source={require('../assets/leaf_logo.png')}/>
      <Text style={styles.label}>Stefan Todoran</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    borderColor: LOGO_GREEN,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 15,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: win.width / 2,
  },
  label: {
    textAlign: "center",
    color: LOGO_GREEN,
    fontSize: 16,
    paddingRight: 5,
  },
  icon: {
    height: 30,
    width: 30,
  }
});