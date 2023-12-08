import { FlatList, View } from "react-native";
import React, { useCallback, useContext, useRef } from "react";
import LevelCard from "../components/LevelCard";
import GlobalContext from "../GlobalContext";
import { Level, PageView } from "../util/types";
import { colors, purpleTheme } from "../Theme";

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application. 
  playLevelCallback: (index: number) => void // Sets the current play level in the parent state so it can be passed to the PlayLevel component. 
  editorLevelCallback?: (newState: Level) => void // Sets the current editor level in the parent state so it can be passed to the CreateLevel component. 

  levels: Level[],
  playLevel: number, // The index in levels of the level currently being played (if a level is being played). 
  // editorLevel?: string, // The uuid of level currently being edited (if a level is being edited). 

  elementHeight: number, // The card component size, used for pre scroll.
  storeElementHeightCallback: (height: number) => void, // Sets the element size, so this doesn't have to be recalculated every time we want to display the component.

  mode: PageView.LEVELS | PageView.EDIT,
}

function LevelSelectBase({
  viewCallback,
  playLevelCallback,
  editorLevelCallback,
  levels,
  playLevel,
  elementHeight,
  storeElementHeightCallback,
  mode,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = mode === PageView.LEVELS ? purpleTheme : colors.RED_THEME;
  
  const openLevel = useCallback((levelIndex: number) => {
    playLevelCallback(levelIndex);
    viewCallback(PageView.PLAY);
  }, []);

  const resumeLevel = useCallback(() => {
    viewCallback(PageView.PLAY);
  }, []);

  const editLevel = useCallback((levelIndex: number) => {
    editorLevelCallback!(levels[levelIndex]);
    viewCallback(PageView.EDIT);
  }, []);
  
  const scrollRef = useRef<any>();
  const resumeUUID = levels[playLevel]?.uuid;
  let scrollIndex = Math.max(0, levels.findIndex(level => level.uuid === resumeUUID));

  return (
    <>
      {/* This component exists just to calculate the height of level cards. */}
      {!elementHeight && <View
        onLayout={(event) => {
          let { height } = event.nativeEvent.layout;
          storeElementHeightCallback(height);
          console.log("storeElementHeightCallback");
        }}
        style={{ opacity: 0 }}
      >
        <LevelCard
          playCallback={openLevel}
          resumeCallback={() => viewCallback(PageView.PLAY)}
          levelIndex={0}
          level={levels[0]}
          darkMode={darkMode}
          theme={useTheme}
          mode={mode}
        />
      </View>}

      {elementHeight !== 0 &&
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
            <LevelCard
              playCallback={item.uuid === resumeUUID ? undefined : openLevel}
              resumeCallback={item.uuid === resumeUUID ? resumeLevel : undefined}
              editCallback={editorLevelCallback ? editLevel : undefined}
              levelIndex={index}
              level={levels[index]}
              darkMode={darkMode}
              theme={useTheme}
              mode={mode}
            />
          }
          keyExtractor={item => item.uuid}
          getItemLayout={(_data, index) => (
            { length: elementHeight, offset: elementHeight * index, index }
          )}
          onLayout={() => {
            if (scrollIndex) scrollRef.current.scrollToIndex({ index: scrollIndex, animated: false });
          }}
        />
      }
    </>
  );
}

const LevelSelect = React.memo(LevelSelectBase);
export default LevelSelect;