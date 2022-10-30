import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import React, { useState, useRef, useCallback } from "react";

import MenuButton from '../components/MenuButton';
import GameBoard from '../components/GameBoard';
import Inventory from './Inventory';
import { initializeGameObj } from '../Game';
const win = Dimensions.get('window');

export default function PlayLevel({ pageCallback, level }) {
  const [coins, setCoinsState] = useState(0);
  const [keys, setKeysState] = useState(0);
  const [prevPos, setPrevPos] = useState( {y: null, x: null} );

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const touchPos = useRef( {y: null, x: null} );
  const game = useRef( initializeGameObj(level) );

  const handleGesture = (up, down, left, right) => {
    console.log(up, down, left, right);
    setPrevPos( {y: game.current.player.y, x: game.current.player.x} );
    if (up) {
      game.current.player.y -= 1;
    } else if (down) {
      game.current.player.y += 1;
    } else if (left) {
      game.current.player.x -= 1;
    } else if (right) {
      game.current.player.x += 1;
    }
    forceUpdate();
  }

  return (
    <View style={styles.container}
    onTouchStart={e => {
      touchPos.current.y = e.nativeEvent.pageY;
      touchPos.current.x = e.nativeEvent.pageX;
    }}
    onTouchEnd={e => {
      const distance = 35; // TODO: probably set this based on screen size later

      const vertDist = touchPos.current.y - e.nativeEvent.pageY;
      const horizDist = touchPos.current.x - e.nativeEvent.pageX;

      const up = (vertDist > distance);
      const down = (vertDist < -distance);
      const left = (horizDist > distance);
      const right = (horizDist < -distance);

      if (bti(up) + bti(down) + bti(left) + bti(right) === 1) {
        handleGesture(up, down, left, right);
        return;
      }

      const diff = Math.abs(vertDist) - Math.abs(horizDist);
      if (diff > 0) {
          handleGesture(up, down, false, false);
      } else {
          handleGesture(false, false, left, right);
      }
    }}>
      <GameBoard board={game.current.board} player={game.current.player} prev={prevPos}/>
      <Inventory coins={coins} maxCoins={game.current.coins} keys={keys}/>
      <View style={styles.row}>
        <MenuButton onPress={pageCallback} value="level_select" label="Levels" icon={require('../assets/flag.png')} width={win.width / 3}/>
        <MenuButton onPress={pageCallback} value="home" label="Menu" icon={require('../assets/door.png')} width={win.width / 3}/>
      </View>
    </View>
  );
}

// Boolean to integer, returns 0 or 1 for false or true respectively
function bti(bool) {
  return bool === true ? 1 : 0;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    paddingTop: win.height * 0.05,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
});