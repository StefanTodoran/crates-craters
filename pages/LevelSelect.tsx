import { FlatList, View } from "react-native";
import React, { useCallback, useContext, useRef } from "react";
import { Level, PageView } from "../util/types";
import { eventEmitter } from "../util/events";
import GlobalContext from "../GlobalContext";
import LevelCard from "../components/LevelCard";

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string) => void, // Sets the current play level in the parent state so it can be passed to the PlayLevel component and played.
  editorLevelCallback?: (uuid: string) => void, // Requests to start editing a certain level by uuid.

  levels: Level[],
  scrollTo?: string, // The index in levels of the level currently being played (if a level is being played). 

  elementHeight: number, // The card component size, used for pre scroll.
  storeElementHeightCallback: (height: number) => void, // Sets the element size, so this doesn't have to be recalculated every time we want to display the component.

  mode: PageView.LEVELS | PageView.EDIT,
}

function LevelSelectBase({
  viewCallback,
  playLevelCallback,
  editorLevelCallback,
  levels,
  scrollTo,
  elementHeight,
  storeElementHeightCallback,
  mode,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  const openLevel = useCallback((levelIndex: number) => {
    playLevelCallback(levels[levelIndex].uuid);
    viewCallback(PageView.PLAY);
  }, []);

  const resumeLevel = useCallback(() => {
    viewCallback(PageView.PLAY);
  }, []);

  const editLevel = useCallback((levelIndex: number) => {
    editorLevelCallback!(levels[levelIndex].uuid);
    eventEmitter.emit("doPageChange", { detail: 1 });
  }, []);

  const scrollRef = useRef<any>();
  let scrollIndex = Math.max(0, levels.findIndex(level => level.uuid === scrollTo));

  return (
    <>
      {/* This component exists just to calculate the height of level cards. */}
      {!elementHeight && <View
        onLayout={(event) => {
          let { height } = event.nativeEvent.layout;
          storeElementHeightCallback(height);
        }}
        style={{ opacity: 0 }}
      >
        <LevelCard
          playCallback={() => openLevel(0)}
          resumeCallback={() => viewCallback(PageView.PLAY)}
          levelIndex={0}
          level={levels[0]}
          darkMode={darkMode}
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
          renderItem={({ item, index }) => {
            const playCallback = () => openLevel(index);
            const editCallback = () => editLevel(index);

            let showResumeOption = item.uuid === scrollTo;
            if (mode === PageView.EDIT) showResumeOption = false;

            return <LevelCard
              playCallback={showResumeOption ? undefined : playCallback}
              resumeCallback={showResumeOption ? resumeLevel : undefined}
              editCallback={editorLevelCallback ? editCallback : undefined}
              levelIndex={index}
              level={levels[index]}
              darkMode={darkMode}
              mode={mode}
            />
          }}
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