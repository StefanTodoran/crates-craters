import { Animated, View, Text, StyleSheet } from "react-native";
import React, { useRef, useState } from "react";
import { colors } from "../Theme";
import { normalize } from "../TextStyles";

import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";
import IconButton from "../components/IconButton";

import GuideIcon from "../assets/main_theme/help.png";
import SettingsIcon from "../assets/main_theme/settings.png";
import AboutIcon from "../assets/main_theme/about.png";
// import ProfileIcon from "../assets/main_theme/profile.png";

enum Subpage {
  HOWTO,
  SETTINGS,
  ABOUT,
  PROFILE,
}

interface Props {
  darkModeCallback: (darkMode: boolean) => void,
  audioModeCallback: (playAudio: boolean) => void,
  setSensitivityCallback: (sensitivity: number) => void,
  setTapDelayCallback: (delay: number) => void,
}

export default function HomePage({
  darkModeCallback,
  audioModeCallback,
  setSensitivityCallback,
  setTapDelayCallback,
}: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
      toValue: animState,
      duration: 150,
      useNativeDriver: true
    }).start(callback);
  }

  const [pageState, setPageState] = useState(Subpage.SETTINGS);
  // const [pageState, setPageState] = useState(Subpage.PROFILE);
  const updatePageState = (newPageState: Subpage) => {
    if (newPageState === pageState) return;
    setAnimTo(0, () => {
      setPageState(newPageState);
      setAnimTo(1);
    });
  }


  let content = <></>;
  switch (pageState) {
    case Subpage.HOWTO:
      content = <HowToPlay />;
      break;

    case Subpage.SETTINGS:
      content = <Settings
        darkModeCallback={darkModeCallback}
        audioModeCallback={audioModeCallback}
        setThemeCallback={() => { }}
        setSensitivityCallback={setSensitivityCallback}
        setTapDelayCallback={setTapDelayCallback}
      />;
      break;

    case Subpage.ABOUT:
      content = <About />
      break;

    case Subpage.PROFILE:
      content = <Text>Profile Page (TODO)</Text>
      break;
  }

  return (
    <>
      <Animated.View style={styles.pageContainer(anim)}>
        {content}
      </Animated.View>

      <View style={styles.menu}>
        <IconButton
          color={colors.GREEN_THEME.MAIN_COLOR}
          label={"Guide"}
          icon={GuideIcon}
          onPress={() => updatePageState(Subpage.HOWTO)}
        />
        <IconButton
          color={colors.GREEN_THEME.MAIN_COLOR}
          label={"Settings"}
          icon={SettingsIcon}
          onPress={() => updatePageState(Subpage.SETTINGS)}
        />
        <IconButton
          color={colors.GREEN_THEME.MAIN_COLOR}
          label={"About"}
          icon={AboutIcon}
          onPress={() => updatePageState(Subpage.ABOUT)}
        />
        {/* <IconButton
          color={colors.GREEN_THEME.MAIN_COLOR}
          label={"Profile"}
          icon={ProfileIcon}
          onPress={() => updatePageState(Subpage.PROFILE)}
        /> */}

        <Animated.View style={styles.indicator(anim, pageState)}/>
      </View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  menu: {
    position: "relative",
    flexDirection: "row",
    gap: normalize(20),
    marginBottom: normalize(20),
    width: "100%",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: colors.LIGHT_GRAY,
  },
  pageContainer: (anim: Animated.Value) => ({
    flex: 1,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: anim,
  }),
  indicator: (anim: Animated.Value, page: number) => ({
    position: "absolute",
    bottom: 0,
    width: normalize(50),
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.GREEN_THEME.MAIN_COLOR,
    transform: [{
      translateX: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, [-79, 0, 79][page]],
      }),
    }],
  }),
});