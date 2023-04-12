import { FlatList } from 'react-native';
import React, { useEffect } from "react";

import { levels, importStoredLevels } from '../Game';
import LevelCard from '../components/LevelCard';

/**
 * @param {Function} viewCallback Sets the current view of the application. 
 * @param {Function} levelCallback Sets the current level in the parent state so it can be passed to the PlayLevel component. 
 * 
 * @param {number} level The level currently being played (if a level is being played). 
 * @param {Object} game The current game object, if a game is in progress.
 */
export default function LevelSelect({ viewCallback, levelCallback, level, game }) {
  const openLevel = (level) => {
    levelCallback(level);
    viewCallback("play");
  }

  useEffect(() => {
    importStoredLevels();
  }, []);

  const playing = (!game || game.won || game.playtest) ? -1 : level;

  return (
    <>
      <FlatList
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={{
          overflow: "hidden",
        }}
        contentContainerStyle={{
          paddingHorizontal: "5%",
          paddingVertical: "5%",
          alignItems: "center",
        }}
        data={levels}
        renderItem={({ item, index }) =>
          index === playing ?
            <LevelCard onPress={viewCallback} onPressValue={"play"} levelIndex={index} inProgress={true} /> :
            <LevelCard onPress={openLevel} onPressValue={index} levelIndex={index} inProgress={false} />
        }
        keyExtractor={item => `${item.name},${item.designer}`}
        onEndReached={() => { importStoredLevels(); }}
      />
    </>
  );
}