import { useContext, useRef } from "react";
import { Animated, Dimensions, ScrollView, StyleSheet, View } from "react-native";
import MenuPage from "./MenuPage";
import GlobalContext from "../GlobalContext";

import CrateGraphic from "../assets/crates.png";
import BombGraphic from "../assets/bomb.png";
import DoorGraphic from "../assets/door_n_keys.png";
import CoinGraphic from "../assets/coin_stack.png";
import { normalize } from "../TextStyles";
import { PageView } from "../util/types";
import { PageTheme } from "./Header";

const win = Dimensions.get("window");
export const menuPages = [
  {
    color: "#CCB7E5",
    banner: PageTheme.PURPLE,
    source: CrateGraphic,
    text: "LEVELS",
    target: PageView.LEVELS,
  },
  {
    color: "#FCB5B5",
    banner: PageTheme.RED,
    source: BombGraphic,
    text: "EDITOR",
    target: PageView.EDIT,
  },
  {
    color: "#FFE08E",
    banner: PageTheme.YELLOW,
    source: CoinGraphic,
    text: "STORE",
    target: PageView.STORE,
  },
  {
    color: "#BBE6BC",
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
  openPage: (target: PageView) => void,
}

export default function Menu({ openPage }: Props) {
  const { darkMode } = useContext(GlobalContext);
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
          ...styles.background,
          backgroundColor: anim.interpolate({
            inputRange: inputRange,
            outputRange: pageColors,
          }),
        }} />

        {menuPages.map((page, idx) =>
          <Animated.View style={{
            opacity: anim.interpolate({
              inputRange: inputRange,
              outputRange: createPageOutputRange(idx),
            }),
          }}>
            <MenuPage
              key={idx}
              icon={page.source}
              text={page.text}
              callback={() => openPage(page.target)}
              darkMode={darkMode}
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
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  navigation: {
    position: "absolute",
    bottom: normalize(30),
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