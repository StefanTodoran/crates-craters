import { Animated, View, Text } from "react-native";
import React, { useContext, useRef, useState } from "react";

import GlobalContext from "../GlobalContext";
import { PageView } from "../util/types";
import { colors } from "../Theme";
import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";
import IconButton from "../components/IconButton";
import { normalize } from "../TextStyles";

import GuideIcon from "../assets/main_theme/help.png";
import SettingsIcon from "../assets/main_theme/settings.png";
import AboutIcon from "../assets/main_theme/about.png";
import ProfileIcon from "../assets/main_theme/profile.png";

enum Subpage {
  ABOUT,
  HOWTO,
  SETTINGS,
  PROFILE,
}

interface Props {
  viewCallback: (newView: PageView) => void,
  darkModeCallback: (darkMode: boolean) => void,
  audioModeCallback: (playAudio: boolean) => void,
  setSensitivityCallback: (sensitivity: number) => void,
  setTapDelayCallback: (delay: number) => void,
}

export default function HomePage({
  viewCallback,
  darkModeCallback,
  audioModeCallback,
  setSensitivityCallback,
  setTapDelayCallback,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
      toValue: animState,
      duration: 150,
      useNativeDriver: true
    }).start(callback);
  }

  const [pageState, setPageState] = useState(Subpage.PROFILE); // false or the model which should be open
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
          color={colors.MAIN_GREEN}
          label={"Guide"}
          icon={GuideIcon}
          onPress={() => updatePageState(Subpage.HOWTO)}
        />
        <IconButton
          color={colors.MAIN_GREEN}
          label={"Settings"}
          icon={SettingsIcon}
          onPress={() => updatePageState(Subpage.SETTINGS)}
        />
        <IconButton
          color={colors.MAIN_GREEN}
          label={"About"}
          icon={AboutIcon}
          onPress={() => updatePageState(Subpage.ABOUT)}
        />
        <IconButton
          color={colors.MAIN_GREEN}
          label={"Profile"}
          icon={ProfileIcon}
          onPress={() => updatePageState(Subpage.PROFILE)}
        />
      </View>
    </>
  );
}

const styles: any = {
  menu: {
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
    // transform: [{
    //   translateY: anim.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: [100, 0],
    //   }),
    // }],
  }),
};