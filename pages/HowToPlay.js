import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import React, { useContext } from "react";

import { colors, graphics } from '../Theme';
import MenuButton from '../components/MenuButton';
import { GlobalContext } from '../GlobalContext';
import TextStyles, { normalize } from '../TextStyles';
const win = Dimensions.get('window');

export default function HowToPlay({ pageCallback }) {
  const { darkMode, dragSensitivity } = useContext(GlobalContext);

  return (
    <>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{
        paddingHorizontal: win.width * 0.05,
        paddingVertical: win.height * 0.01,
      }}
        overScrollMode="never" showsVerticalScrollIndicator={false}>
        <Text style={TextStyles.subtitle(darkMode)}>
          Controls
        </Text>
        <Text style={TextStyles.paragraph(darkMode)}>
          Swipe anywhere on the screen to control the player. Swipe in any direction to move one tile in that
          direction. You cannot move diagonally. If there is a tile you could navigate to (without pushing
          any crates) double tap on that tile to save some time and skip to that position.
        </Text>

        <Text style={TextStyles.subtitle(darkMode)}>
          Objective
        </Text>
        <Text style={TextStyles.paragraph(darkMode)}>
          The goal of the game is to collect all coins before making your way to the finish flag.
        </Text>
        <View style={styles.row}>
          <Image style={styles.icon} source={graphics.FLAG} />
          <Image style={styles.icon} source={graphics.COIN} />
        </View>
        <Text style={TextStyles.paragraph(darkMode)}>
          This is the ONLY requirement. You do not need to collect all keys, open all doors, or detonate all bombs.
        </Text>

        <Text style={TextStyles.subtitle(darkMode)}>
          Obstacles
        </Text>
        <Text style={TextStyles.paragraph(darkMode)}>
          The first obstacle are doors. Any key can unlock any door, but each key
          is single use.
        </Text>
        <View style={styles.row}>
          <Image style={styles.icon} source={graphics.DOOR_ICON} />
          <Image style={styles.icon} source={graphics.KEY} />
        </View>

        <Text style={TextStyles.paragraph(darkMode)}>
          The primary obstacle are crates and craters. You can't walk on either of these
          tiles. However, if there is either an empty space or a crater behind a crate, you can push
          it. If you push a crate into a crater, it "fills" the crater, creating a walkable tile.
        </Text>
        <View style={styles.row}>
          <Image style={styles.icon} source={graphics.CRATE} />
          <Image style={styles.icon} source={graphics.CRATER} />
        </View>

        <Text style={TextStyles.paragraph(darkMode)}>
          The another obstacle are one-way tiles. Only the player can pass through these tiles,
          pushable tiles cannot. The player can enter them from any side except the side the arrow is
          pointing towards.
        </Text>
        <View style={styles.row}>
          <Image style={styles.icon} source={graphics.ONE_WAY_LEFT} />
          <Image style={styles.icon} source={graphics.ONE_WAY_UP} />
          <Image style={styles.icon} source={graphics.ONE_WAY_DOWN} />
          <Image style={styles.icon} source={graphics.ONE_WAY_RIGHT} />
        </View>

        <Text style={TextStyles.paragraph(darkMode)}>
          Lastly, we have bombs. These can be pushed just like crates, but cannot fill in craters. After
          a set number of turns, the fuse expires and the bomb explodes adjacent crates.
        </Text>
        <View style={styles.row}>
          <Image style={styles.icon} source={graphics.BOMB} />
          <Image style={styles.icon} source={graphics.EXPLOSION} />
        </View>

        <View style={styles.buttonContainer}>
          <MenuButton onPress={pageCallback} value={false} label="Back to Menu" icon={graphics.DOOR_ICON} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: win.width * 0.225,
    marginBottom: normalize(32),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: normalize(16),
  },
  icon: {
    height: 30,
    width: 30,
  },
  scrollContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    overflow: "hidden",
  }
});