import { Text, View, Dimensions, Image, Animated, ScaledSize, StyleSheet } from "react-native";
import React, { useEffect, useRef } from "react";
import GameBoard from "./GameBoard";
import SimpleButton from "./SimpleButton";

import TextStyles, { normalize } from "../TextStyles";
import { Theme, graphics } from "../Theme";
import { getSpawnPosition } from "../util/logic";
import { Level, PageView } from "../util/types";

const win = Dimensions.get("window");

interface Props {
  playCallback?: (index: number) => void, // The callback used to initiate the current level for playing. If not provided, the level is currently being played.
  resumeCallback?: () => void, // Used to resume play if this level is currently being played.
  editCallback?: (index: number) => void,
  level: Level,
  levelIndex: number,
  darkMode: boolean,
  theme: Theme,
  mode: PageView.LEVELS | PageView.EDIT,
}

function LevelCardBase({
  playCallback,
  resumeCallback,
  editCallback,
  level,
  levelIndex,
  darkMode,
  theme,
  mode,
}: Props) {
  const tileSize = calcTileSize(level.board[0].length, win);
  const playerPos = getSpawnPosition(level.board);

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
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState,
      duration: 200,
      useNativeDriver: true
    }).start(callback);
  }

  useEffect(() => {
    setAnimTo(1);
    // setTimeout(() => {
    //   setAnimTo(1);
    // }, (levelIndex - scrollIndex) * 100);
  }, []);

  let attributionText;
  if (level.official) attributionText = "Standard Level";
  if (!level.official) attributionText = `Designed by "${level.designer}"`;

  return (
    <Animated.View style={[
      styles.container,
      {
        borderColor: theme.DARK_COLOR,
        borderWidth: !playCallback ? 2 : 1,
        paddingHorizontal: !playCallback ? normalize(15) - 2 : normalize(15),
        backgroundColor: !playCallback ? theme.MAIN_TRANSPARENT(0.25) : (darkMode ? theme.MAIN_TRANSPARENT(0.15) : theme.OFF_WHITE),
        opacity: anim,
        transform: [{
          scale: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        }],
      },
    ]}>

      <View style={styles.row}>
        <View style={styles.levelLabel}>
          {/* Icon & Number */}
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Image
              style={styles.bigIcon}
              source={mode === PageView.EDIT ? graphics.METAL_CRATE : level.official ? graphics.CRATE : graphics.CRATER}
            />
            <Text allowFontScaling={false} style={styles.number}>{levelIndex + 1}</Text>
          </View>

          {/* Name & Designer */}
          <View style={{ flexDirection: "column", justifyContent: "center", marginLeft: normalize(10) }}>
            <Text
              allowFontScaling={false}
              style={[TextStyles.subtitle(darkMode, theme.DARK_COLOR), styles.levelName]}
              numberOfLines={1}
            >{level.name}</Text>
            <Text
              allowFontScaling={false}
              style={[TextStyles.paragraph(darkMode), styles.designerName]}
              numberOfLines={1}
            >{attributionText}</Text>
          </View>
        </View>

        {mode === PageView.LEVELS && <View style={{ flexDirection: "row" }}>
          {!playCallback && <Image style={styles.icon} source={graphics.PLAYER} />}
          {level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
        </View>}
      </View>

      <View style={styles.row}>
        <GameBoard
          board={level.board.slice(previewTop, previewBottom)}
          overrideTileSize={tileSize}
          rowCorrect={-0.1}
        />

        <View style={{ flexDirection: "column", flex: 0.9 }}>
          {playCallback && <SimpleButton
            text={"Play"}
            icon={graphics.PLAY_ICON}
            main={true}
            theme={theme}
            onPress={() => playCallback(levelIndex)}
          />}

          {resumeCallback && <SimpleButton
            text={"Resume"}
            icon={graphics.KEY_ICON}
            main={true}
            theme={theme}
            onPress={resumeCallback}
          />}

          {!editCallback && <SimpleButton
            text={"Stats"}
            icon={graphics.SHARE_ICON}
            disabled={true}
            onPress={() => {
              // TODO: implement this page, then go to it
            }}
          />}

          {editCallback && <SimpleButton
            text={"Edit"}
            icon={graphics.HAMMER_ICON}
            theme={theme}
            onPress={() => {
              // editCallback(levelIndex);
              // viewCallback("edit");
            }}
          />}
        </View>
      </View>

    </Animated.View>
  );
}

const LevelCard = React.memo(LevelCardBase);
export default LevelCard;

function calcTileSize(boardWidth: number, window: ScaledSize) {
  const maxWidth = (window.width * 0.5) / boardWidth;
  return Math.floor(maxWidth);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: win.width * 0.9,
    paddingBottom: normalize(5),
    borderRadius: normalize(10),
    marginVertical: normalize(10),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    // paddingHorizontal: normalize(15),
    paddingVertical: normalize(10),
  },
  levelLabel: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  number: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: normalize(15),
    color: "#fff",
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  icon: {
    height: normalize(25),
    width: normalize(25),
  },
  bigIcon: {
    height: normalize(35),
    width: normalize(35),
  },
  levelName: {
    marginTop: 0,
    marginBottom: 0,
  },
  designerName: {
    marginTop: -normalize(5),
    marginBottom: 0,
  },
});