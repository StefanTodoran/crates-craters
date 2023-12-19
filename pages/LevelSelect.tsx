import { FlatList, View } from "react-native";
import React, { useCallback, useContext, useRef } from "react";
import LevelCard from "../components/LevelCard";
import GlobalContext from "../GlobalContext";
import { colors, graphics, purpleTheme } from "../Theme";
import { BlankCanvas, Level, PageView } from "../util/types";
import SimpleButton from "../components/SimpleButton";

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string) => void, // Sets the current play level in the parent state so it can be passed to the PlayLevel component and played.
  editorLevelCallback?: (uuid: string) => void, // Sets the current editor level in the parent state so it can be passed to the EditLevel component and edited.

  levels: Level[],
  playLevel: number, // The index in levels of the level currently being played (if a level is being played). 

  elementHeight: number, // The card component size, used for pre scroll.
  storeElementHeightCallback: (height: number) => void, // Sets the element size, so this doesn't have to be recalculated every time we want to display the component.

  mode: PageView.LEVELS | PageView.EDIT,
  createLevelCallback?: () => void, // Used to prompt the parent to bring up the level creation screen.
}

function LevelSelectBase({
  viewCallback,
  playLevelCallback,
  editorLevelCallback,
  levels,
  playLevel,
  elementHeight,
  storeElementHeightCallback,
  createLevelCallback,
  mode,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = mode === PageView.LEVELS ? purpleTheme : colors.RED_THEME;

  let displayLevels = [...levels];
  if (mode === PageView.EDIT) displayLevels = [{ uuid: "create" } as Level, ...levels];

  const openLevel = useCallback((levelIndex: number) => {
    playLevelCallback(levels[levelIndex].uuid);
    viewCallback(PageView.PLAY);
  }, []);

  const resumeLevel = useCallback(() => {
    viewCallback(PageView.PLAY);
  }, []);

  const editLevel = useCallback((levelIndex: number) => {
    editorLevelCallback!(levels[levelIndex].uuid);
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
          data={displayLevels}
          renderItem={({ item, index }) => {
            if (item.uuid === "create") {
              return <LevelCard
                playCallback={undefined}
                resumeCallback={undefined}
                editCallback={undefined}
                levelIndex={index - 1}
                level={BlankCanvas}
                darkMode={darkMode}
                mode={mode}
                overrideAttribution={true}
              >
                <SimpleButton
                  text={"Create"}
                  icon={graphics.OPTIONS_ICON}
                  theme={useTheme}
                  onPress={createLevelCallback}
                />
              </LevelCard>;
            }

            const adjustedIndex = (mode === PageView.EDIT) ? index - 1 : index;

            const playCallback = () => openLevel(adjustedIndex);
            const editCallback = () => editLevel(adjustedIndex);

            return <LevelCard
              playCallback={item.uuid === resumeUUID ? undefined : playCallback}
              resumeCallback={item.uuid === resumeUUID ? resumeLevel : undefined}
              editCallback={editorLevelCallback ? editCallback : undefined}
              levelIndex={adjustedIndex}
              level={displayLevels[index]}
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