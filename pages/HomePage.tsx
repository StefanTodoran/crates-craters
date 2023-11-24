import { StyleSheet, Animated } from "react-native";
import React, { useContext, useRef, useState } from "react";

import GlobalContext from "../GlobalContext";
import { colors, graphics } from "../Theme";
import { PageView } from "../util/types";
import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";
import MenuButton from "../components/MenuButton";
import ShareLevel from "./ShareLevel";

enum ModalPage {
  NONE,
  ABOUT,
  HOWTO,
  SETTINGS,
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
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  const [modalOpen, setModalState] = useState(ModalPage.NONE); // false or the model which should be open
  const setModalOpen = (modalState: boolean) => {
    if (modalState) {
      setModalState(modalState);
      setAnimTo(1);
    } else {
      setAnimTo(0, () => {
        setModalState(modalState);
      });
    }
  }

  let content = <></>;
  if (modalOpen === ModalPage.ABOUT) {
    content = <About pageCallback={setModalOpen}/>
  } else if (modalOpen === ModalPage.HOWTO) {
    content = <HowToPlay pageCallback={setModalOpen} />;
  } else if (modalOpen === ModalPage.SETTINGS) {
    content = <Settings pageCallback={setModalOpen} darkModeCallback={darkModeCallback} audioModeCallback={audioModeCallback}
    setThemeCallback={() => {}} setSensitivityCallback={setSensitivityCallback} setTapDelayCallback={setTapDelayCallback} />;
  }

  return (
    <>
      <MenuButton onPress={setModalOpen} value="how" label="How to Play" icon={graphics.HELP_ICON} />
      <MenuButton onPress={setModalOpen} value="settings" label="App Settings" icon={graphics.OPTIONS_ICON} />
      <MenuButton onPress={setModalOpen} value="about" label="About the App" icon={graphics.PLAYER} />
      <MenuButton onPress={viewCallback} value="home" label="Go Back" icon={graphics.DOOR_ICON}/>

      {false && modalOpen &&
        <Animated.View style={styles.modal(darkMode, anim)}>
          {content}
        </Animated.View>
      }
    </>
  );
}

const styles = StyleSheet.create({
  modal: (dark, anim) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: (dark) ? colors.NEAR_BLACK : "white",
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
      }),
    }],
  }),
});