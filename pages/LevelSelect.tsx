import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../util/store";
import { useScrollToTop } from "../components/Subpages";
import { FlatList, ImageSourcePropType, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { TAB_BAR_CLEARANCE } from "../components/Subpages";
import Toast from "react-native-toast-message";
import EmptyList, { EmptyListProps } from "../components/EmptyList";
import LevelCard, { FOOTNOTE_HEIGHT, IndicatorIcon, StatChip } from "../components/LevelCard";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, purpleTheme } from "../Theme";
import { Level, PageView } from "../util/types";

interface SecondButtonProps {
  text?: string | ((uuid: string, index: number) => string | undefined), // No text hides the button.
  icon?: ImageSourcePropType | ((uuid: string, index: number) => ImageSourcePropType),
  callback?: (uuid: string, index: number) => void, // Triggers an effect on the current level.
  disabled?: boolean | ((uuid: string, index: number) => boolean),
}

/** The like button on a card's board preview (shared levels). */
export interface CardActions {
  isLiked?: (uuid: string) => boolean,
  canLike?: (uuid: string) => boolean,
  onLike?: (uuid: string) => void,
}

interface Props {
  viewCallback: (newView: PageView) => void, // Sets the current view of the application.
  playLevelCallback: (uuid: string, index: number) => void, // Sets the current play level in the parent state so it can be passed to the PlayLevel component and played.
  resumeLevelCallback?: () => void,

  secondButtonProps?: SecondButtonProps,
  cardActions?: CardActions,
  headerComponent?: React.ReactElement,
  footerText?: string,

  theme?: Theme,
  levels: Level[],
  noNumber?: boolean,
  getStats?: (targetLevel: Level) => StatChip[] | undefined,
  getSubtitle?: (targetLevel: Level) => string | undefined, // Replaces the line under a card's name.
  getFootnote?: (targetLevel: Level) => string | undefined, // Small print under a card's pills.

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
  cardActions,
  headerComponent,
  footerText,
  theme,
  levels,
  noNumber,
  getStats,
  getSubtitle,
  getFootnote,
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
  const win = useWindowDimensions();
  const pageAnimating = useAppStore(state => state.pageAnimating);
  const [refreshing, setRefreshing] = useState(false);
  const useTheme = theme || purpleTheme;

  // The furthest beaten level, not the end of the first beaten run: a level added
  // earlier in the order mustn't re-lock everything the player already unlocked.
  const lastBeatenLevel = useMemo(() => levels.findLastIndex(level => level.completed), [levels]);

  const scrollRef = useRef<FlatList<Level>>(null);
  useScrollToTop(() => scrollRef.current?.scrollToOffset({ offset: 0, animated: true }));
  let scrollIndex = levels.findIndex(level => level.uuid === scrollTo);
  if (scrollIndex === -1) scrollIndex = lastBeatenLevel;  // If a level is not currently in progress/resumable, scroll to the last beaten level.
  scrollIndex = Math.max(0, scrollIndex);

  const [loadedLevels, setLoadedLevels] = useState(scrollIndex + cardsPerScreen);
  useEffect(() => setLoadedLevels(scrollIndex + cardsPerScreen), [levels]);
  const displayLevels = levels.slice(0, loadedLevels);

  useEffect(() => {
    if (levels.length === 0) return;
    // "latest": the latest unlocked level, the one after the last beaten.
    if (scrollTo === "latest") scrollRef.current?.scrollToIndex({ index: Math.min(lastBeatenLevel + 1, displayLevels.length - 1), animated: true });
  }, [scrollTo, loadedLevels]);

  const doRefresh = useCallback(() => {
    if (!onRefresh) return;
    setRefreshing(true);
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
  }, [onRefresh]); // onRefresh closes over the caller's current filters, so it must stay fresh.

  // Card callbacks are stable (they take the card's index and read current props
  // through this ref), so memoized cards don't re-render when the parent does.
  const latest = useRef({ levels, playLevelCallback, resumeLevelCallback, viewCallback, secondButtonProps, cardActions });
  latest.current = { levels, playLevelCallback, resumeLevelCallback, viewCallback, secondButtonProps, cardActions };

  const openLevel = useCallback((levelIndex: number) => {
    const { levels, playLevelCallback, viewCallback } = latest.current;
    playLevelCallback(levels[levelIndex].uuid, levelIndex);
    viewCallback(PageView.PLAY);
  }, []);

  const resumeLevel = useCallback(() => {
    latest.current.resumeLevelCallback?.();
    latest.current.viewCallback(PageView.PLAY);
  }, []);

  const secondButtonOnPress = useCallback((levelIndex: number) => {
    const { levels, secondButtonProps } = latest.current;
    secondButtonProps?.callback?.(levels[levelIndex].uuid, levelIndex);
  }, []);

  const likeLevel = useCallback((levelIndex: number) => {
    const { levels, cardActions } = latest.current;
    cardActions?.onLike?.(levels[levelIndex].uuid);
  }, []);

  // getItemLayout offsets must include everything above the first card.
  const [headerHeight, setHeaderHeight] = useState(0);
  const listTopPadding = win.width * 0.05; // paddingVertical "5%" resolves against the list's width.

  // Cards with a footnote are a fixed amount taller (elementHeight is measured without one).
  const footnotes = useMemo(() => levels.map(level => getFootnote?.(level)), [levels, getFootnote]);
  const cardOffsets = useMemo(() => {
    const offsets = [0];
    footnotes.forEach(footnote => offsets.push(offsets[offsets.length - 1] + elementHeight + (footnote ? FOOTNOTE_HEIGHT : 0)));
    return offsets;
  }, [footnotes, elementHeight]);

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
          onPlay={() => { }}
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
          // While the page panel slides in, render only the visible cards. FlatList
          // otherwise mounts its next batch of off-screen cards (each board preview is
          // many views) a few frames in, which stalls the UI thread mid-slide.
          windowSize={pageAnimating ? 1 : undefined}
          onEndReached={() => {
            setLoadedLevels(Math.min(levels.length, loadedLevels + 10));
            onEndReached && onEndReached();
          }}
          ListHeaderComponent={headerComponent &&
            <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>{headerComponent}</View>}
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
            const evaluate = <T,>(value: T | ((uuid: string, index: number) => T) | undefined) =>
              typeof value === "function" ? (value as (uuid: string, index: number) => T)(item.uuid, index) : value;

            return <LevelCard
              onPlay={openLevel}
              onResume={resumeLevel}
              showResume={allowResume && item.uuid === scrollTo}
              stats={getStats?.(item)}
              subtitle={getSubtitle?.(item)}
              footnote={footnotes[index]}
              levelIndex={index}
              level={item}
              darkMode={darkMode}
              useTheme={useTheme}
              noNumber={noNumber}
              indicatorIcon={indicatorIcon}
              isLocked={isOfficial && index > lastBeatenLevel + 1}
              secondButtonText={evaluate(secondButtonProps?.text)}
              secondButtonIcon={evaluate(secondButtonProps?.icon)}
              secondButtonDisabled={evaluate(secondButtonProps?.disabled)}
              onSecondButton={secondButtonProps ? secondButtonOnPress : undefined}
              liked={cardActions?.isLiked?.(item.uuid)}
              canLike={cardActions?.canLike?.(item.uuid)}
              onLike={cardActions?.onLike ? likeLevel : undefined}
            />;
          }}
          keyExtractor={item => item.uuid}
          getItemLayout={(_data, index) => (
            { length: cardOffsets[index + 1] - cardOffsets[index], offset: listTopPadding + headerHeight + cardOffsets[index], index }
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
    paddingBottom: TAB_BAR_CLEARANCE,
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: normalize(10),
    marginBottom: normalize(20),
  },
});