import { StyleSheet, Image, Dimensions, View, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";

import { colors, graphics } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import LevelSelect from '../pages/LevelSelect';
import PlayLevel from '../pages/PlayLevel';
import MenuButton from '../components/MenuButton';
const win = Dimensions.get('window');

export default function PlayPage({ levelCallback, gameStateCallback, scrollCallback, editorCallback, level, game, playTest }) {
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
  const setModalOpen = (modalState, suppressScrollCallback) => {
    if (modalState) {
      setModalState(modalState);
      setAnimTo(1);
    } else {
      setAnimTo(0, () => {
        setModalState(modalState);
      });
    }

    if (!suppressScrollCallback) {
      scrollCallback(modalState !== "play");
    }
  }

  let content = <></>;
  if (modalOpen === "play") {
    content = <PlayLevel pageCallback={setModalOpen} levelCallback={levelCallback} editorCallback={editorCallback}
      gameStateCallback={gameStateCallback} level={level} game={game} test={playTest} />;
  } else if (modalOpen === "select") {
    content = <LevelSelect pageCallback={setModalOpen} levelCallback={levelCallback} />;
  }

  useEffect(() => {
    if (playTest) {
      setModalOpen("play");
    } else {
      setModalOpen(false, true);
    }
  }, [playTest]);

  return (
    <>
      <MenuButton onPress={setModalOpen} value="play" label="Resume" icon={graphics.KEY} disabled={!game || game.won || game.playtest} />
      <MenuButton onPress={setModalOpen} value="select" label="Level Select" icon={graphics.FLAG} />

      {modalOpen &&
        <Animated.View style={styles.modal(darkMode, anim)}>
          {content}
        </Animated.View>
      }
    </>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.9, 141, 681)[0],
    height: sizeFromWidthPercent(0.9, 141, 681)[1],
  },
  text: darkMode => ({
    width: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
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