import { StyleSheet, Image, Dimensions, View, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";

import { colors, graphics } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import About from '../pages/About';
import Settings from '../pages/Settings';
import HowToPlay from '../pages/HowToPlay';
import MenuButton from '../components/MenuButton';
const win = Dimensions.get('window');

export default function HomePage({ darkModeCallback, setThemeCallback, audioModeCallback, setSensitivityCallback, setTapDelayCallback }) {
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
  }

  return (
    <>
      <MenuButton onPress={setModalOpen} value="how" label="How to Play" icon={graphics.HELP_ICON} />
      <MenuButton onPress={setModalOpen} value="settings" label="App Settings" icon={graphics.OPTIONS_ICON} />
      <MenuButton onPress={setModalOpen} value="about" label="About the App" icon={graphics.PLAYER} />

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: win.width * 0.225,

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