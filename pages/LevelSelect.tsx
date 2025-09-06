import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import EmptyList, { EmptyListProps } from "../components/EmptyList";
import LevelCard, { IndicatorIcon } from "../components/LevelCard";
import SimpleButton from "../components/SimpleButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, purpleTheme } from "../Theme";
import { Level, PageView } from "../util/types";

interface SecondButtonProps {
  text?: string | ((uuid: string, index: number) => string),
  icon?: ImageSourcePropType,
  callback?: (uuid: string, index: number) => void, // Triggers an effect on the current level.
  disabled?: boolean | ((uuid: string, index: number) => boolean),
}

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string, index: number) => void, // Sets the current play level in the parent state so it can be passed to the PlayLevel component and played.
  resumeLevelCallback?: () => void,

  secondButtonProps?: SecondButtonProps,
  headerComponent?: React.ReactElement,
  footerText?: string,

  theme?: Theme,
  levels: Level[],
  noNumber?: boolean,
  getStats?: (targetLevel: Level) => string[] | undefined,

  scrollTo?: string, // The index in levels of the level currently being played (if a level is being played). 
  allowResume?: boolean,
  isOfficial?: boolean,
  indicatorIcon?: IndicatorIcon,

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
  resumeLevelCallback,
  secondButtonProps,
  headerComponent,
  footerText,
  theme,
  levels,
  noNumber,
  getStats,
  scrollTo,
  allowResume,
  isOfficial,
  indicatorIcon,
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

  const lastBeatenLevel = useMemo(() => {
    let lastBeaten = -1;
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].completed) {
        lastBeaten = i;
      } else {
        break;
      }
    }
    return lastBeaten;
  }, [levels]);

  const scrollRef = useRef<FlatList<Level>>(null);
  let scrollIndex = levels.findIndex(level => level.uuid === scrollTo);
  if (scrollIndex === -1) scrollIndex = lastBeatenLevel;  // If a level is not currently in progress/resumable, scroll to the last beaten level.
  scrollIndex = Math.max(0, scrollIndex);

  const [loadedLevels, setLoadedLevels] = useState(scrollIndex + cardsPerScreen);
  useEffect(() => setLoadedLevels(scrollIndex + cardsPerScreen), [levels]);
  const displayLevels = levels.slice(0, loadedLevels);

  useEffect(() => {
    if (levels.length === 0) return;
    if (scrollTo === "last") scrollRef.current?.scrollToIndex({ index: displayLevels.length - 1, animated: true });
  }, [scrollTo, loadedLevels]);

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
    playLevelCallback(levels[levelIndex].uuid, levelIndex);
    viewCallback(PageView.PLAY);
  }, [levels]);

  const resumeLevel = useCallback(() => {
    resumeLevelCallback && resumeLevelCallback();
    viewCallback(PageView.PLAY);
  }, []);

  const secondButtonOnPress = useCallback((levelIndex: number) => {
    secondButtonProps!.callback!(levels[levelIndex].uuid, levelIndex);
  }, [levels]);

  return (
    <>
      {/* This component exists just to calculate the height of level cards. */}
      {levels.length > 0 && !elementHeight && <View
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

      {levels.length === 0 && !elementHeight &&
        <View style={styles.container}>
          {headerComponent}
          <EmptyList
            {...emptyListProps}
            onPress={emptyListProps.onPress || doRefresh}
            buttonTheme={useTheme}
          />
        </View>
      }

      {elementHeight !== 0 &&
        <FlatList
          ref={scrollRef}
          // overScrollMode="never"
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}

          data={displayLevels}
          initialNumToRender={cardsPerScreen}
          onEndReached={() => {
            setLoadedLevels(Math.min(levels.length, loadedLevels + 10));
            onEndReached && onEndReached();
          }}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={<EmptyList
            {...emptyListProps}
            onPress={emptyListProps.onPress || doRefresh}
            buttonTheme={useTheme}
          />}
          ListFooterComponent={levels.length > 0 && (loadedLevels < levels.length || !!footerText) ? <Text style={[TextStyles.paragraph(darkMode), styles.loadingText]}>
            {loadedLevels < levels.length ? "Loading..." : footerText}
          </Text> : undefined}

          refreshing={refreshing || !!overrideRefreshing}
          onRefresh={onRefresh ? doRefresh : undefined}

          renderItem={({ item, index }) => {
            const playCallback = () => openLevel(index);
            const sbCallback = () => secondButtonOnPress(index);

            const isLocked = isOfficial && index > lastBeatenLevel + 1;

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
              indicatorIcon={indicatorIcon}
              isLocked={isLocked}
            >
              {secondButtonProps && <SimpleButton
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
            if (scrollIndex) scrollRef.current?.scrollToIndex({ index: scrollIndex, animated: false });
          }}
          removeClippedSubviews
        />
      }
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: "5%",
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: normalize(10),
    marginBottom: normalize(20),
  },
});