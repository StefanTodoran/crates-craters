import { View, StyleSheet, Dimensions, Image, Animated, Pressable } from 'react-native';
import React, { useState, useRef } from "react";

import MenuButton from '../components/MenuButton';
import LevelOption from '../components/LevelOption';

import { levels, importStoredLevels } from '../Game';
import { graphics } from '../Theme';
import Selector from '../components/Selector';
const win = Dimensions.get('window');

/**
 * @param {Function} pageCallback Sets the current open page for the modal in the parent. 
 * @param {Function} levelCallback Sets the current level in the parent state so it can be passed to the PlayLevel component. 
 * 
 * @param {Function} selectPage Which page of levels should be shown.
 * @param {Function} setSelectPage Used to change the current page being shown.
 */
export default function LevelSelect({ pageCallback, levelCallback, selectPage, setSelectPage }) {
  const openLevel = (level) => {
    levelCallback(level);
    pageCallback("play");
  }

  const level_buttons = [];
  const pageSize = 6; // should be even

  const pageStart = selectPage * pageSize;
  const pageEnd = (selectPage + 1) * pageSize;
  importStoredLevels();
  for (let i = pageStart; i < pageEnd; i += 2) {
    const levelButton = (num) => {
      if (levels[num]) {
        return <LevelOption key={`select<${num}>`} onPress={openLevel} value={num} level={levels[num]} />;
      }
      // Most of the values don't matter but we still give it text and an icon 
      // so it is size the same, since we are using this invisible button as padding.
      return <LevelOption key={`invisible<${num}>`} />;
    }
    level_buttons.push(
      <View style={styles.buttonsRow}>
        {levelButton(i)}
        {levelButton(i + 1)}
      </View>
    );
  }

  const anim = useRef(new Animated.Value(1)).current;
  const pageChange = (value) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      setSelectPage(value);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    });
  };

  return (
    <>
      {/* <Image style={styles.banner} source={graphics.LEVEL_SELECT_BANNER} /> */}
      <Animated.View style={{
        opacity: anim
      }}>
        {level_buttons}
      </Animated.View>
      <View style={{ marginTop: 35, marginBottom: 15 }}>
        <Selector
          onNext={() => { pageChange(selectPage + 1) }} nextDisabled={!levels[pageEnd]}
          onPrev={() => { pageChange(Math.max(0, selectPage - 1)) }} prevDisabled={selectPage === 0}
          // For some reason fast clicks in succession can move page below zero before 
          // disabling kicks in, unless we add this min and max force.
          label={`Page #${selectPage + 1}`} />
      </View>
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
  buttonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: win.width * 0.45,
  }
});