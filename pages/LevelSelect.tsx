import { Text, FlatList, StyleSheet, View, ImageSourcePropType } from "react-native";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

import GlobalContext from "../GlobalContext";
import { Level, PageView } from "../util/types";
import { Theme, purpleTheme } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";

import Toast from "react-native-toast-message";
import LevelCard from "../components/LevelCard";
import SimpleButton from "../components/SimpleButton";
import EmptyList, { EmptyListProps } from "../components/EmptyList";

interface SecondButtonProps {
  text?: string | ((uuid: string, index: number) => string),
  icon?: ImageSourcePropType,
  callback?: (uuid: string, index: number) => void, // Triggers an effect on the current level.
  disabled?: boolean | ((uuid: string, index: number) => boolean),
}

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string) => void, // Sets the current play level in the parent state so it can be passed to the PlayLevel component and played.
  secondButtonProps: SecondButtonProps,
  headerComponent?: React.ReactElement,
  footerText?: string,

  theme?: Theme,
  levels: Level[],
  noNumber?: boolean,
  getStats?: (targetLevel: Level) => string[] | undefined,

  scrollTo?: string, // The index in levels of the level currently being played (if a level is being played). 
  allowResume?: boolean,
  showCompletion?: boolean,

  onRefresh?: () => Promise<boolean>,
  overrideRefreshing?: boolean,
  onEndReached?: () => void,
  emptyListProps: EmptyListProps,

  elementHeight: number, // The card component size, used for pre scroll.
  storeElementHeightCallback: (height: number) => void, // Sets the element size, so this doesn't have to be recalculated every time we want to display the component.
}

// It isn't really possible to see more than 5 LevelCards on the screen at once.
const cardsPerScreen = 5;

export default function LevelSelect({
  viewCallback,
  playLevelCallback,
  secondButtonProps,
  headerComponent,
  footerText,
  theme,
  levels,
  noNumber,
  getStats,
  scrollTo,
  allowResume,
  showCompletion,
  onRefresh,
  overrideRefreshing,
  onEndReached,
  emptyListProps,
  elementHeight,
  storeElementHeightCallback,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [refreshing, setRefreshing] = useState(false);
  const useTheme = theme || purpleTheme;

  const scrollRef = useRef<any>();
  let scrollIndex = Math.max(0, levels.findIndex(level => level.uuid === scrollTo));

  const [loadedLevels, setLoadedLevels] = useState(scrollIndex + cardsPerScreen);
  useEffect(() => setLoadedLevels(scrollIndex + cardsPerScreen), [levels]);
  const displayLevels = levels.slice(0, loadedLevels);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    // @ts-expect-error We won't call doRefresh if onRefresh isn't defined.
    onRefresh().then((success) => {
      setRefreshing(false);
      if (success) {
        Toast.show({
          type: "success",
          text1: "Level refresh succeeded.",
          text2: "Your levels have been successfully updated.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Level refresh failed.",
          text2: "Please check your connection and try again.",
        });
      }
    });
  }, []);

  const openLevel = useCallback((levelIndex: number) => {
    playLevelCallback(levels[levelIndex].uuid);
    viewCallback(PageView.PLAY);
  }, [levels]);

  const resumeLevel = useCallback(() => {
    viewCallback(PageView.PLAY);
  }, []);

  const secondButtonOnPress = useCallback((levelIndex: number) => {
    secondButtonProps.callback!(levels[levelIndex].uuid, levelIndex);
  }, [levels]);

  if (levels.length === 0) return (<>
    {headerComponent}
    <EmptyList
      {...emptyListProps}
      onPress={emptyListProps.onPress || doRefresh}
      buttonTheme={useTheme}
    />
  </>);

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
          playCallback={() => { }}
          levelIndex={0}
          level={levels[0]}
          darkMode={darkMode}
          useTheme={useTheme}
        />
      </View>}

      {elementHeight !== 0 &&
        <FlatList
          ref={scrollRef}
          // style={{ overflow: "hidden" }}
          contentContainerStyle={styles.contentContainer}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}

          data={displayLevels}
          initialNumToRender={cardsPerScreen}
          onEndReached={() => {
            setLoadedLevels(Math.min(levels.length, loadedLevels + 10));
            onEndReached && onEndReached();
          }}
          ListHeaderComponent={headerComponent}
          ListFooterComponent={(loadedLevels < levels.length || !!footerText) ? <Text style={[TextStyles.paragraph(darkMode), styles.loadingText]}>
            {loadedLevels < levels.length ? "Loading..." : footerText}
          </Text> : undefined}

          refreshing={refreshing || !!overrideRefreshing}
          onRefresh={onRefresh ? doRefresh : undefined}

          renderItem={({ item, index }) => {
            const playCallback = () => openLevel(index);
            const sbCallback = () => secondButtonOnPress(index);

            let showResumeOption = item.uuid === scrollTo;
            if (!allowResume) showResumeOption = false;

            return <LevelCard
              playCallback={showResumeOption ? undefined : playCallback}
              resumeCallback={showResumeOption ? resumeLevel : undefined}
              stats={getStats && getStats(item)}
              levelIndex={index}
              level={displayLevels[index]}
              darkMode={darkMode}
              useTheme={useTheme}
              noNumber={noNumber}
              showCompletion={showCompletion}
            >
              {secondButtonProps.callback && <SimpleButton
                text={typeof secondButtonProps.text === "function" ? secondButtonProps.text(item.uuid, index) : secondButtonProps.text}
                disabled={typeof secondButtonProps.disabled === "function" ? secondButtonProps.disabled(item.uuid, index) : secondButtonProps.disabled}
                icon={secondButtonProps.icon}
                onPress={sbCallback}
                theme={useTheme}
              />}
            </LevelCard>
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

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: "5%",
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: normalize(10),
    marginBottom: normalize(20),
  },
});