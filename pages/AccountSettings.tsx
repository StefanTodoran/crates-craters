import { Animated, View } from "react-native";
import React, { useContext, useRef, useState } from "react";

import GlobalContext from "../GlobalContext";
import { PageView } from "../util/types";
import { colors } from "../Theme";
import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";
import IconButton from "../components/IconButton";

import GuideIcon from "../assets/main_theme/help.png";
import SettingsIcon from "../assets/main_theme/settings.png";
import AboutIcon from "../assets/main_theme/about.png";
import { normalize } from "../TextStyles";

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
      <View style={styles.menu}>
        <IconButton
          color={colors.MAIN_GREEN}
          label={"Guide"}
          icon={GuideIcon}
          onPress={() => setmodalState(ModalPage.HOWTO)}
        />
        <IconButton
          color={colors.MAIN_GREEN}
          label={"Settings"}
          icon={SettingsIcon}
          onPress={() => setmodalState(ModalPage.SETTINGS)}
        />
        <IconButton
          color={colors.MAIN_GREEN}
          label={"About"}
          icon={AboutIcon}
          onPress={() => setmodalState(ModalPage.ABOUT)}
        />
      </View>

      {modalState !== ModalPage.NONE &&
        <Animated.View style={styles.modal(darkMode, anim)}>
          {content}
        </Animated.View>
      }
    </>
  );
}

const styles: any = {
  menu: {
    flexDirection: "row",
    gap: normalize(20),
  },
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