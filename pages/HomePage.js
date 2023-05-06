import { StyleSheet, Animated } from 'react-native';
import React, { useContext, useRef, useState } from "react";

import { colors, graphics } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import About from '../pages/About';
import Settings from '../pages/Settings';
import HowToPlay from '../pages/HowToPlay';
import MenuButton from '../components/MenuButton';
import ShareLevel from './ShareLevel';
import { countCustomLevels } from '../Game';

export default function HomePage({ darkModeCallback, setThemeCallback, audioModeCallback, setSensitivityCallback, setTapDelayCallback, viewCallback }) {
  const { darkMode } = useContext(GlobalContext);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState, callback) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
      toValue: animState,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  const [modalOpen, setModalState] = useState(false); // false or the model which should be open
  const setModalOpen = (modalState) => {
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
  if (modalOpen === "about") {
    content = <About pageCallback={setModalOpen}/>
  } else if (modalOpen === "how") {
    content = <HowToPlay pageCallback={setModalOpen} />;
  } else if (modalOpen === "settings") {
    content = <Settings pageCallback={setModalOpen} darkModeCallback={darkModeCallback} audioModeCallback={audioModeCallback}
    setThemeCallback={setThemeCallback} setSensitivityCallback={setSensitivityCallback} setTapDelayCallback={setTapDelayCallback} />;
  } else if (modalOpen === "share") {
    content = <ShareLevel pageCallback={setModalOpen}/>
  }

  return (
    <>
      <MenuButton onPress={setModalOpen} value="how" label="How to Play" icon={graphics.HELP_ICON} />
      <MenuButton onPress={setModalOpen} value="settings" label="App Settings" icon={graphics.OPTIONS_ICON} />
      <MenuButton onPress={setModalOpen} value="about" label="About the App" icon={graphics.PLAYER} />
      <MenuButton onPress={setModalOpen} value="share" label="Share Levels" icon={graphics.SHARE_ICON} disabled={countCustomLevels() === 0}/>
      <MenuButton onPress={viewCallback} value="home" label="Return to Home" icon={graphics.DOOR_ICON}/>

      {modalOpen &&
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