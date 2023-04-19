import { Text, StyleSheet, View, Dimensions, Image, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";
import { colors, graphics } from '../Theme';
import TextStyles, { normalize } from '../TextStyles';
import { getSpawnPos, levels } from '../Game';
import { GlobalContext } from '../GlobalContext';
import GameBoard from './GameBoard';
import SimpleButton from './SimpleButton';
const win = Dimensions.get('window');

const LevelCard = React.memo(
  function LevelCard({ viewCallback, playCallback, editCallback, levelIndex }) {
    const { darkMode } = useContext(GlobalContext);
    const level = levels[levelIndex];

    if (!level) return;

    const defaultLevel = level.designer === "default";
    const specialLevel = level.designer === "special";

    const tileSize = calcTileSize(level.board[0].length, win);
    const playerPos = getSpawnPos(level.board);

    const previewSize = 2;
    let previewTop, previewBottom;
    if (playerPos.y - previewSize < 0) {
      previewTop = 0;
      previewBottom = (previewSize * 2);
    } else if (playerPos.y + previewSize > level.board.length) {
      previewTop = level.board.length - (previewSize * 2);
      previewBottom = level.board.length;
    } else {
      previewTop = playerPos.y - previewSize;
      previewBottom = playerPos.y + previewSize;
    }

    const anim = useRef(new Animated.Value(0)).current;
    const setAnimTo = (animState, callback) => {
      Animated.timing(anim, {
        toValue: animState,
        duration: 200,
        useNativeDriver: true
      }).start(callback);
    }

    useEffect(() => {
      // setTimeout(() => {
      setAnimTo(1);
      // }, levelIndex * 100);
    }, []);

    return (
      <Animated.View style={styles.container(anim, darkMode)}>

        <View style={styles.row}>
          <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
            {/* Icon & Number */}
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Image style={styles.bigIcon} source={defaultLevel ? graphics.CRATE : graphics.CRATER} />
              <Text style={styles.number()}>{levelIndex + 1}</Text>
            </View>

            {/* Name & Designer */}
            <View style={{ flexDirection: "column", justifyContent: "center", marginLeft: normalize(10) }}>
              <Text style={styles.levelName(darkMode)} numberOfLines={1}>{level.name}</Text>
              {!(defaultLevel || specialLevel) &&
                <Text style={styles.designerName(darkMode)} numberOfLines={1}>Designed by "{level.designer}"</Text>}
              {defaultLevel && <Text style={styles.designerName(darkMode)}>Standard Level</Text>}
              {specialLevel && <Text style={styles.designerName(darkMode)}>Empty Canvas</Text>}
            </View>
          </View>

          {level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
        </View>

        <View style={styles.row}>
          <GameBoard board={level.board.slice(previewTop, previewBottom)} overrideTileSize={tileSize} rowCorrect={-0.1} />

          <View style={{ flexDirection: "column", flex: 0.9 }}>
            {playCallback && <SimpleButton onPress={() => { playCallback(levelIndex) }} text={"Play"} icon={graphics.PLAY_ICON} />}
            {!playCallback && <SimpleButton onPress={() => { viewCallback("play") }} text={"Resume"} icon={graphics.KEY_ICON} />}
            <SimpleButton text={"Edit"} icon={graphics.HAMMER_ICON} onPress={() => {
              editCallback(levelIndex);
              viewCallback("edit");
            }} disabled={defaultLevel} />
          </View>
        </View>

      </Animated.View>
    );
  }
);

export default LevelCard;

function calcTileSize(boardWidth, window) {
  const maxWidth = (window.width * 0.5) / boardWidth;
  return Math.floor(maxWidth);
}

const styles = StyleSheet.create({
  container: (anim, darkMode) => ({
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: win.width * 0.9,
    borderWidth: 1,
    borderRadius: normalize(10),
    marginVertical: normalize(10),
    borderColor: colors.DARK_PURPLE,
    backgroundColor: darkMode ? colors.MAIN_PURPLE_TRANSPARENT(0.1) : colors.OFF_WHITE,
    opacity: anim,
    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1],
      }),
    }],
  }),
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(10),
  },
  number: () => ({
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: normalize(15),
    color: colors.OFF_WHITE,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  }),
  icon: {
    height: normalize(25),
    width: normalize(25),
  },
  bigIcon: {
    height: normalize(35),
    width: normalize(35),
  },
  levelName: (darkMode) => ({
    ...TextStyles.subtitle(darkMode),
    marginTop: 0,
    marginBottom: 0,
  }),
  designerName: (darkMode) => ({
    ...TextStyles.paragraph(darkMode),
    marginTop: 0,
    marginBottom: 0,
  }),
});