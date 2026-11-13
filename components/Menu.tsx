import { memo, useMemo, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View, useWindowDimensions } from "react-native";
import BombGraphic from "../assets/bomb.png";
import CoinGraphic from "../assets/coin_stack.png";
import CrateGraphic from "../assets/crates.png";
import DoorGraphic from "../assets/door_n_keys.png";
import { normalize } from "../TextStyles";
import { PageView } from "../util/types";
import { PageTheme } from "./Header";
import MenuPage from "./MenuPage";

export const menuPages = [
  {
    color: "#CCB7E5",
    darkColor: "#6b3ba5", // Not the same as the theme's DARK_COLOR
    banner: PageTheme.PURPLE,
    source: CrateGraphic,
    text: "LEVELS",
    target: PageView.LEVELS,
  },
  {
    color: "#FCB5B5",
    darkColor: "#953131",
    banner: PageTheme.RED,
    source: BombGraphic,
    text: "EDITOR",
    target: PageView.MANAGE,
  },
  {
    color: "#FFE08E",
    darkColor: "#b88700",
    banner: PageTheme.YELLOW,
    source: CoinGraphic,
    text: "PROFILE",
    target: PageView.STORE,
  },
  {
    color: "#BBE6BC",
    darkColor: "#328534",
    banner: PageTheme.GREEN,
    source: DoorGraphic,
    text: "SETTINGS",
    target: PageView.SETTINGS,
  },
];

const pageColors = menuPages.map(page => page.color);
const inputRange = Array.from(Array(pageColors.length).keys());

function createPageOutputRange(activeIndex: number) {
  return inputRange.map((_, idx) => idx === activeIndex ? 1 : 0);
}

const activeColor = "#fff";
const inactiveColor = "#ffffff00";
function createNodeOutputRange(activeIndex: number) {
  return inputRange.map((_, idx) => idx === activeIndex ? activeColor : inactiveColor);
}

interface Props {
  notificationCounts: number[],
  openPage: (target: PageView) => void,
}

/**
 * The home menu: one swipeable page per section. The background color and page dots
 * follow the scroll position on the native thread. Memoized, since App re-renders on
 * every game move while this stays mounted underneath.
 */
export default memo(function Menu({ notificationCounts, openPage }: Props) {
  const win = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  const animated = useMemo(() => {
    // Scroll position in pages, clamped: iOS bounce overscroll pushes it past either
    // end, and the native driver ignores `extrapolate` for color outputs (it only
    // clamps numbers), so the colors must be fed an already-clamped value.
    const page = Animated.divide(scrollX, win.width).interpolate({
      inputRange: [0, menuPages.length - 1],
      outputRange: [0, menuPages.length - 1],
      extrapolate: "clamp",
    });
    return {
      onScroll: Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true }),
      background: page.interpolate({ inputRange, outputRange: pageColors }),
      pageOpacity: menuPages.map((_, idx) => page.interpolate({ inputRange, outputRange: createPageOutputRange(idx) })),
      nodeColor: menuPages.map((_, idx) => page.interpolate({ inputRange, outputRange: createNodeOutputRange(idx) })),
    };
  }, [win.width]);

  return (
    <>
      {/* The background lives behind the ScrollView (not inside its content) so
          iOS bounce overscroll past the first/last page reveals the page color
          instead of an empty white gap. */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: animated.background }]} />

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={animated.onScroll}
      >
        {menuPages.map((page, idx) =>
          <Animated.View key={idx} style={{ opacity: animated.pageOpacity[idx] }}>
            <MenuPage
              icon={page.source}
              text={page.text}
              callback={() => openPage(page.target)}
              updates={notificationCounts[idx]}
              darkColor={page.darkColor}
            />
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Clear Android's navigation bar, which the window doesn't include. */}
      <View style={[styles.navigation, { bottom: Math.max(Dimensions.get("screen").height - win.height, normalize(45)) }]}>
        {animated.nodeColor.map((color, idx) =>
          <Animated.View key={idx} style={[styles.node, { backgroundColor: color }]} />
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  navigation: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  node: {
    borderColor: "white",
    borderWidth: 1,
    borderRadius: normalize(10) / 2,
    marginHorizontal: normalize(5),
    height: normalize(10),
    width: normalize(10),
  },
});
