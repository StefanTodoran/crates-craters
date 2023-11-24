import { Animated } from "react-native";
import React, { useContext, useRef, useState } from "react";

import GlobalContext from "../GlobalContext";
import { colors, graphics } from "../Theme";
import { PageView } from "../util/types";
import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";
import MenuButton from "../components/MenuButton";

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

  const [modalState, setModalState] = useState(ModalPage.NONE); // false or the model which should be open
  const setmodalState = (modalState: ModalPage) => {
    if (modalState !== ModalPage.NONE) {
      setModalState(modalState);
      setAnimTo(1);
    } else {
      setAnimTo(0, () => {
        setModalState(modalState);
      });
    }
  }
  
  const closeModal = () => setmodalState(ModalPage.NONE);
  let content = <></>;

  switch (modalState) {
    case ModalPage.HOWTO:
      content = <HowToPlay pageCallback={closeModal} />;
      break;

    case ModalPage.SETTINGS:
      content = <Settings
        pageCallback={closeModal}
        darkModeCallback={darkModeCallback}
        audioModeCallback={audioModeCallback}
        setThemeCallback={() => { }}
        setSensitivityCallback={setSensitivityCallback}
        setTapDelayCallback={setTapDelayCallback}
      />;
      break;

    case ModalPage.ABOUT:
      content = <About pageCallback={closeModal} />
      break;
  }

  return (
    <>
      <MenuButton onPress={() => setmodalState(ModalPage.HOWTO)} label="How to Play" icon={graphics.HELP_ICON} />
      <MenuButton onPress={() => setmodalState(ModalPage.SETTINGS)} label="App Settings" icon={graphics.OPTIONS_ICON} />
      <MenuButton onPress={() => setmodalState(ModalPage.ABOUT)} label="About the App" icon={graphics.PLAYER} />
      <MenuButton onPress={() => viewCallback(PageView.MENU)} label="Go Back" icon={graphics.DOOR_ICON} />

      {modalState !== ModalPage.NONE &&
        <Animated.View style={styles.modal(darkMode, anim)}>
          {content}
        </Animated.View>
      }
    </>
  );
}

const styles: any = {
  modal: (darkMode: boolean, animState: Animated.Value) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    opacity: animState,
    transform: [{
      translateY: animState.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
      }),
    }],
  }),
};