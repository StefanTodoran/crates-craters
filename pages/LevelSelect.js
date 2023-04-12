import { FlatList, View } from 'react-native';
import React, { useEffect, useRef, useState } from "react";

import { levels, importStoredLevels } from '../Game';
import LevelCard from '../components/LevelCard';

/**
 * @param {Function} viewCallback Sets the current view of the application. 
 * @param {Function} playLevelCallback Sets the current play level in the parent state so it can be passed to the PlayLevel component. 
 * @param {Function} editorLevelCallback Sets the current editor level in the parent state so it can be passed to the CreateLevel component. 
 * 
 * @param {number} level The level currently being played (if a level is being played). 
 * @param {Object} game The current game object, if a game is in progress.
 */
export default function LevelSelect({ viewCallback, playLevelCallback, editorLevelCallback, level, game }) {
  const [elementHeight, setElementHeight] = useState(false);

  const openLevel = (level) => {
    playLevelCallback(level);
    viewCallback("play");
  }

  useEffect(() => {
    importStoredLevels();
  }, []);

  const playing = (!game || game.won || game.playtest) ? -1 : level;

  return (
    <>
      {!elementHeight && <View onLayout={(event) => {
        let { x, y, width, height } = event.nativeEvent.layout;
        setElementHeight(height);
      }} style={{ opacity: 0 }}>
        <LevelCard viewCallback={viewCallback} levelCallback={openLevel} levelIndex={0} inProgress={playing === 0} />
      </View>}
      {elementHeight &&
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
              <LevelCard viewCallback={viewCallback} editCallback={editorLevelCallback}
                levelIndex={index} inProgress={true} /> :
              <LevelCard viewCallback={viewCallback} editCallback={editorLevelCallback}
                playCallback={openLevel} levelIndex={index} inProgress={false} />
          }
          keyExtractor={item => `${item.name},${item.designer}`}
          getItemLayout={(data, index) => (
            { length: elementHeight, offset: elementHeight * index, index }
          )}
        // initialScrollIndex={(!game || game.won || game.playtest) ? 0 : level}
        // onEndReached={() => { importStoredLevels(); }}
        />
      }
    </>
  );
}