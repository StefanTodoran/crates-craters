import { StyleSheet, Dimensions, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";

import { colors } from '../Theme';
import { GlobalContext } from '../GlobalContext';
import LevelSelect from '../pages/LevelSelect';
import PlayLevel from '../pages/PlayLevel';

export default function PlayPage({ levelCallback, gameStateCallback, scrollCallback, editorCallback, level, game }) {
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

    scrollCallback(!modalState);
  }

  return (
    <>
      {modalOpen &&
        <Animated.View style={styles.modal(darkMode, anim)}>
          <PlayLevel pageCallback={setModalOpen} levelCallback={levelCallback} editorCallback={editorCallback}
            gameStateCallback={gameStateCallback} level={level} game={game} />
        </Animated.View>
      }
      {!modalOpen && <>
        <LevelSelect pageCallback={setModalOpen} levelCallback={levelCallback} level={level} game={game}/>
      </>}
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