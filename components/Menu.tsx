import { Animated, Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { useRef } from "react";
import MenuPage from "./MenuPage";

import CrateGraphic from "../assets/crates.png";
import BombGraphic from "../assets/bomb.png";
import DoorGraphic from "../assets/door_n_keys.png";
import CoinGraphic from "../assets/coin_stack.png";
import { normalize } from "../TextStyles";
import { PageView } from "../util/types";
import { PageTheme } from "./Header";

const win = Dimensions.get("window");
const scrn = Dimensions.get("screen");

const bottomNavHeight = scrn.height - win.height;

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
  const outputRange = [];
  // inputRange.map((_, idx) => outputRange.push(idx === activeIndex ? activeColor : inactiveColor));
  for (let i = 0; i < inputRange.length; i++) {
    outputRange.push(i === activeIndex ? activeColor : inactiveColor);
  }
  return outputRange;
}

interface Props {
  notificationCounts: number[],
  openPage: (target: PageView) => void,
}

export default function Menu({ notificationCounts, openPage }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  return (
    <>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        onScroll={(evt) => {
          anim.setValue(evt.nativeEvent.contentOffset.x / win.width);
        }}
      >
        <Animated.View style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: anim.interpolate({
            inputRange: inputRange,
            outputRange: pageColors,
          }),
        }} />

        {menuPages.map((page, idx) =>
          <Animated.View key={idx} style={{
            opacity: anim.interpolate({
              inputRange: inputRange,
              outputRange: createPageOutputRange(idx),
            }),
          }}>
            <MenuPage
              icon={page.source}
              text={page.text}
              callback={() => openPage(page.target)}
              updates={notificationCounts[idx]}
              // color={menuPages[idx].color}
              darkColor={menuPages[idx].darkColor}
            />
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.navigation}>
        <Animated.View style={styles.node(anim, createNodeOutputRange(0))} />
        <Animated.View style={styles.node(anim, createNodeOutputRange(1))} />
        <Animated.View style={styles.node(anim, createNodeOutputRange(2))} />
        <Animated.View style={styles.node(anim, createNodeOutputRange(3))} />
      </View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  navigation: {
    position: "absolute",
    bottom: Math.max(bottomNavHeight, normalize(45)),
    // bottom: 0,
    // bottom: normalize(45),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "black"
  },
  node: (anim: Animated.Value, outputRange: string[]) => ({
    backgroundColor: anim.interpolate({
      inputRange: inputRange,
      outputRange: outputRange,
    }),
    borderColor: "white",
    borderWidth: 1,
    borderRadius: normalize(10) / 2,
    marginHorizontal: normalize(5),
    height: normalize(10),
    width: normalize(10),
  }),
});