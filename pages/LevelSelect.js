import { FlatList, View } from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from "react";

import { levels } from '../Game';
import LevelCard from '../components/LevelCard';

/**
 * @param {Function} viewCallback Sets the current view of the application. 
 * @param {Function} playLevelCallback Sets the current play level in the parent state so it can be passed to the PlayLevel component. 
 * @param {Function} editorLevelCallback Sets the current editor level in the parent state so it can be passed to the CreateLevel component. 
 * 
 * @param {number} playLevel The level currently being played (if a level is being played). 
 * @param {number} editorLevel The level currently being edited (if a level is being edited). 
 * @param {Object} game The current game object, if a game is in progress.
 */
export default function LevelSelect({ viewCallback, playLevelCallback, editorLevelCallback, playLevel, editorLevel, game }) {
  const [elementHeight, setElementHeight] = useState(false);
  const scrollRef = useRef();

  const openLevel = useCallback((playLevel) => {
    playLevelCallback(playLevel);
    viewCallback("play");
  }, [playLevel]);

  const playIndex = (!game) ? -1 : playLevel;
  const editIndex = playIndex === -1 ? editorLevel : -1;

  return (
    <>
      {!elementHeight && <View onLayout={(event) => {
        let { x, y, width, height } = event.nativeEvent.layout;
        setElementHeight(height);
      }} style={{ opacity: 0 }}>
        <LevelCard viewCallback={viewCallback} levelCallback={openLevel} levelIndex={0} inProgress={playIndex === 0} />
      </View>}
      {elementHeight &&
        <FlatList
          ref={scrollRef}
          style={{ overflow: "hidden" }}
          contentContainerStyle={{
            paddingHorizontal: "5%",
            paddingVertical: "5%",
            alignItems: "center",
          }}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          data={levels}
          renderItem={({ item, index }) =>
            index === playIndex ?
              <LevelCard viewCallback={viewCallback} editCallback={editorLevelCallback}
                levelIndex={index} inProgress={true} /> :
              <LevelCard viewCallback={viewCallback} editCallback={editorLevelCallback}
                playCallback={openLevel} levelIndex={index} inProgress={false} />
          }
          keyExtractor={item => `${item.name},${item.designer}`}
          getItemLayout={(data, index) => (
            { length: elementHeight, offset: elementHeight * index, index }
          )}
          onLayout={() => {
            if (game && !game.won && !game.playtest && playIndex > 0) {
              scrollRef.current.scrollToIndex({ index: playIndex, animated: false });
            } else if (editIndex > 0) {
              scrollRef.current.scrollToIndex({ index: editIndex, animated: false });
            }
          }}
        />
      }
    </>
  );
}