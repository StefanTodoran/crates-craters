import { FlatList, View } from "react-native";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import LevelCard from "../components/LevelCard";
import { Game } from "../util/logic";
import GlobalContext from "../GlobalContext";
import { PageView } from "../util/types";

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  // playLevelCallback: () => void // Sets the current play level in the parent state so it can be passed to the PlayLevel component. 
  // editorLevelCallback: () => void // Sets the current editor level in the parent state so it can be passed to the CreateLevel component. 

  playLevel?: string, // The uuid of the level currently being played (if a level is being played). 
  editorLevel?: string, // The uuid of level currently being edited (if a level is being edited). 

  elementHeight: number, // The card component size, used for pre scroll.
  storeElementHeightCallback: (height: number) => void, // Sets the element size, so this doesn't have to be recalculated every time we want to display the component.
}

function LevelSelectBase({
  viewCallback,
  // playLevelCallback, 
  // editorLevelCallback, 
  playLevel,
  editorLevel,
  elementHeight,
  storeElementHeightCallback
}: Props) {
  const { levels, darkMode } = useContext(GlobalContext);
  const scrollRef = useRef<any>();

  const openLevel = useCallback((playLevel: string) => {
    // playLevelCallback(playLevel);
    viewCallback(PageView.PLAY);
  }, [playLevel]);

  const scrollIndex = 0;
  // const scrollIndex = (currentGame && !currentGame.playtest && resumeIndex > 0) ? resumeIndex :
  //   (editIndex > 0) ? editIndex : 0;

  return (
    <>
      {/* This component exists just to calculate the height of level cards. */}
      {!elementHeight && <View onLayout={(event) => {
        let { x, y, width, height } = event.nativeEvent.layout;
        storeElementHeightCallback(height);
      }} style={{ opacity: 0 }}>
        <LevelCard
          viewCallback={viewCallback}
          playCallback={openLevel}
          levelIndex={0}
          level={levels[0]}
          darkMode={darkMode}
        />
      </View>}

      {elementHeight !== 0 &&
        <FlatList
          ref={scrollRef}
          style={{ overflow: "hidden" }}
          contentContainerStyle={{
            paddingHorizontal: "5%",
            paddingBottom: "4%",
            paddingTop: "3%",
            alignItems: "center",
          }}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          data={levels}
          renderItem={({ item, index }) =>
            <LevelCard
              viewCallback={viewCallback}
              // editCallback={editorLevelCallback}
              playCallback={item.uuid === playLevel ? undefined : openLevel}
              levelIndex={index}
              level={levels[index]}
              darkMode={darkMode}
            />
          }
          keyExtractor={item => item.uuid}
          getItemLayout={(data, index) => (
            { length: elementHeight, offset: elementHeight * index, index }
          )}
          onLayout={() => {
            if (scrollIndex) {
              scrollRef.current.scrollToIndex({ index: scrollIndex, animated: false });
            }
          }}
        />
      }
    </>
  );
}

const LevelSelect = React.memo(LevelSelectBase);
export default LevelSelect;