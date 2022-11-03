import { View, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import React, { useState, useRef } from "react";
import MenuButton from '../components/MenuButton';

import { levels } from '../Game';
import { graphics } from '../Theme';
const win = Dimensions.get('window');

export default function LevelSelect({ pageCallback, levelCallback }) {
  const [page, setPageState] = useState(0);
  // Controls which levels are currently being shown, i.e.
  // say pageSize is five, then page 0 shows levels 1-5,
  // page 1 shows levels 6-10, so on and so forth.

  const openLevel = (level) => {
    levelCallback(level);
    pageCallback("play_level");
  }

  const level_buttons = [];
  const pageSize = 6; // should be even

  const pageStart = page * pageSize;
  const pageEnd = (page + 1) * pageSize;
  for (let i = pageStart; i < pageEnd; i += 2) {
    const levelButton = (num) => {
      if (levels[num]) {
        // console.log(`select<${num}>`)
        return <MenuButton onPress={openLevel} value={num} label={`Level ${num + 1}`}
          icon={graphics.CRATE} key={`select<${num}>`} width={win.width / 3} />;
      }
      // Most of the values don't matter but we still give it text and an icon 
      // so it is size the same, since we are using this invisible button as padding.
      // console.log(`invisible<${num}>`)
      return <MenuButton onPress={console.log} value={num} label={"invisible"} key={`invisible<${num}>`}
        icon={graphics.CRATE} width={win.width / 3} invisible/>;
    }
    level_buttons.push(
      <View style={styles.row}>
        {levelButton(i)}
        {levelButton(i + 1)}
      </View>
    );
  }

  const anim = useRef(new Animated.Value(1)).current;
  const pageChange = (value) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start(() => {
      setPageState(value);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    });
  };

  return (
    <>
      <Image style={styles.banner} source={graphics.LEVEL_SELECT_BANNER} />
      <Animated.View style={{
        opacity: anim
      }}>
        {level_buttons}
        <View style={styles.row}>
          {page > 0 && <MenuButton onPress={pageChange} value={page - 1} label="Prev Page" width={win.width / 3} />}
          {levels[pageEnd] && <MenuButton onPress={pageChange} value={page + 1} label="Next Page" width={win.width / 3} />}
        </View>
      </Animated.View>
      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={graphics.DOOR} />
    </>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.8, 145, 600)[0],
    height: sizeFromWidthPercent(0.8, 145, 600)[1],
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  icon: {
    height: 30,
    width: 30,
  }
});