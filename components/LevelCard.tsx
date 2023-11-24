import { Text, View, Dimensions, Image, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { colors, graphics } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";
import GameBoard from "./GameBoard";
import SimpleButton from "./SimpleButton";
import { Level, PageView } from "../util/types";
import { getSpawnPosition } from "../util/logic";
const win = Dimensions.get("window");

interface Props {
  viewCallback: (newView: PageView) => void,
  playCallback?: (uuid: string) => void,
  editCallback?: (uuid: string) => void,
  level: Level,
  levelIndex: number,
  darkMode: boolean,
}

function LevelCardBase({
  viewCallback,
  playCallback,
  editCallback,
  level,
  levelIndex,
  darkMode,
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

  return (
    <Animated.View style={styles.container(anim, darkMode, !playCallback)}>

      <View style={styles.row}>
        <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
          {/* Icon & Number */}
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Image style={styles.bigIcon} source={level.official ? graphics.CRATE : graphics.CRATER} />
            <Text allowFontScaling={false} style={styles.number()}>{levelIndex + 1}</Text>
          </View>

          {/* Name & Designer */}
          <View style={{ flexDirection: "column", justifyContent: "center", marginLeft: normalize(10) }}>
            <Text allowFontScaling={false} style={styles.levelName(darkMode)} numberOfLines={1}>{level.name}</Text>
            {!level.official &&
              <Text
                allowFontScaling={false}
                style={styles.designerName(darkMode)}
                numberOfLines={1}
              >
                Designed by "{level.designer}"
              </Text>
            }
            {level.official &&
              <Text allowFontScaling={false}
                style={styles.designerName(darkMode)}
              >
                Standard Level
              </Text>
            }

            {/* {!(level.official || specialLevel) &&
              <Text allowFontScaling={false} style={styles.designerName(darkMode)} numberOfLines={1}>Designed by "{level.designer}"</Text>}
            {level.official && <Text allowFontScaling={false} style={styles.designerName(darkMode)}>Standard Level</Text>}
            {specialLevel && <Text allowFontScaling={false} style={styles.designerName(darkMode)}>Empty Canvas</Text>} */}
          </View>
        </View>

        {!playCallback && <Image style={styles.icon} source={graphics.PLAYER} />}
        {playCallback && level.completed && <Image style={styles.icon} source={graphics.FLAG_ICON} />}
      </View>

      <View style={styles.row}>
        <GameBoard
          board={level.board.slice(previewTop, previewBottom)}
          overrideTileSize={tileSize}
          rowCorrect={-0.1}
        />

        <View style={{ flexDirection: "column", flex: 0.9 }}>
          {playCallback && <SimpleButton onPress={() => { }} text={"Play"} icon={graphics.PLAY_ICON} />}

          {/* {playCallback && <SimpleButton onPress={() => { playCallback(levelIndex) }} text={"Play"} icon={graphics.PLAY_ICON} />}
          {!playCallback && <SimpleButton onPress={() => { viewCallback("play") }} text={"Resume"} icon={graphics.KEY_ICON} main={true} />} */}

          <SimpleButton text={"Edit"} icon={graphics.HAMMER_ICON} onPress={() => {
            // editCallback(levelIndex);
            // viewCallback("edit");
          }} disabled={level.official} />
        </View>
      </View>

    </Animated.View>
  );
}

const LevelCard = React.memo(LevelCardBase);
export default LevelCard;

function calcTileSize(boardWidth: number, window: any) {
  const maxWidth = (window.width * 0.5) / boardWidth;
  return Math.floor(maxWidth);
}

const styles: any = {
  container: (anim: any, darkMode: boolean, highlighted: boolean) => ({
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: win.width * 0.9,
    borderWidth: highlighted ? 2 : 1,
    paddingHorizontal: highlighted ? normalize(15) - 2 : normalize(15),
    paddingBottom: normalize(5),
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
    // paddingHorizontal: normalize(15),
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
  levelName: (darkMode: boolean) => ({
    // @ts-expect-error
    ...TextStyles.subtitle(darkMode),
    marginTop: 0,
    marginBottom: 0,
  }),
  designerName: (darkMode: boolean) => ({
    // @ts-expect-error
    ...TextStyles.paragraph(darkMode),
    marginTop: 0,
    marginBottom: 0,
  }),
};