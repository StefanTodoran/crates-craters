import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, StyleProp, StyleSheet, View } from "react-native";
import { colors, graphics } from "../Theme";
import { getIconSrc } from "../util/board";
import { Game, isValidMove } from "../util/logic";
import { TileType } from "../util/types";
import BombBoardTile from "./BombBoardTile";

interface Offset {
  dx: number,
  dy: number,
}

interface Props {
  game: Game,
  touch: { x: number, y: number },
  darkMode: boolean,
  tileSize: number,
}

export default function Player({
  game,
  touch,
  darkMode,
  tileSize,
}: Props) {
  const optionsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(optionsAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(optionsAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [game.won]);

  const playerSrc = (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;
  const tileStyle = {
    width: tileSize,
    height: tileSize,
  };

  const [options, pushables] = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: JSX.Element[] = [];
    const newPushables: JSX.Element[] = [];
    const offsets: Offset[] = [
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];

    offsets.forEach((offset, index) => {
      const shouldHighlight = isValidMove(game, offset);

      // It would make sense to not add the Animated.View if it isn't over a shouldHighlight tile.
      // However this results in the animation breaking sometimes, even if we add dummy Animated.View
      // with the same id. Oddly the dummy Animated.View with same id prevents some situations
      // which break the Animated.loop, but not all.
      const optionStyle = styles.optionTile(game.player.x + offset.dx, game.player.y + offset.dy, tileSize, optionsAnim, shouldHighlight, darkMode);
      newOptions.push(<Animated.View key={index} style={optionStyle}></Animated.View>);

      const pushable = getAdjacentTile(game, offset, tileSize, tileStyle, shouldHighlight);
      newPushables.push(pushable);
    });

    return [newOptions, newPushables];
  }, [game, tileSize, darkMode]);

  return (
    <>
      <Animated.View style={styles.adjacentTileContainer(game.player.x, game.player.y - 1, tileSize, touch.y, false, false)}>
        {pushables[0]}
      </Animated.View>
      <Animated.View style={styles.adjacentTileContainer(game.player.x - 1, game.player.y, tileSize, touch.x, true, false)}>
        {pushables[1]}
      </Animated.View>
      <Animated.View style={styles.adjacentTileContainer(game.player.x + 1, game.player.y, tileSize, touch.x, true, true)}>
        {pushables[2]}
      </Animated.View>
      <Animated.View style={styles.adjacentTileContainer(game.player.x, game.player.y + 1, tileSize, touch.y, false, true)}>
        {pushables[3]}
      </Animated.View>

      {!game.won && options}
      <Animated.View style={styles.playerContainer(game.player.x, game.player.y, tileSize, touch.x, touch.y)}>
        <Image style={tileStyle} source={playerSrc} />
      </Animated.View>
    </>
  );
}

function getAdjacentTile(game: Game, offset: Offset, tileSize: number, tileStyle: StyleProp<any>, isValidMove: boolean) {
  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;

  const tile = game.board.getTile(yPos, xPos, true);
  if ([TileType.CRATE, TileType.METAL_CRATE, TileType.ICE_BLOCK].includes(tile.id) && isValidMove) {
    return <Image style={tileStyle} source={getIconSrc(tile)} />;
  }
  if (tile.id === TileType.BOMB && isValidMove) {
    return <BombBoardTile tile={tile} icon={getIconSrc(tile)} tileSize={tileSize} />;
  }

  return <View style={tileStyle} />;
}

const styles = StyleSheet.create<any>({
  // tile: (size: number) => ({
  //   width: size,
  //   height: size,
  // }),
  playerContainer: (xPos: number, yPos: number, tileSize: number, touchX: number, touchY: number) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      {
        translateY: Math.abs(touchY) > tileSize ? Math.sign(touchY) * tileSize : touchY,
      },
      {
        translateX: Math.abs(touchX) > tileSize ? Math.sign(touchX) * tileSize : touchX,
      },
    ],
  }),
  adjacentTileContainer: (xPos: number, yPos: number, tileSize: number, touchMove: number, isHorizontal: boolean, clampPositive: boolean) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      isHorizontal ? {
        translateX: clampPositive ?
          Math.max(0, Math.abs(touchMove) > tileSize ? Math.sign(touchMove) * tileSize : touchMove) :
          Math.min(0, Math.abs(touchMove) > tileSize ? Math.sign(touchMove) * tileSize : touchMove),
      } : {
        translateY: clampPositive ?
          Math.max(0, Math.abs(touchMove) > tileSize ? Math.sign(touchMove) * tileSize : touchMove) :
          Math.min(0, Math.abs(touchMove) > tileSize ? Math.sign(touchMove) * tileSize : touchMove),
      },
    ],
  }),
  optionTile: (xPos: number, yPos: number, size: number, anim: Animated.Value, valid: boolean, darkMode: boolean) => ({
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    opacity: valid ? anim.interpolate({ // was originally static 0.4
      inputRange: [0, 1],
      outputRange: [0.75, 0.3],
      // outputRange: [0.5, 0.2],
    }) : 0,

    borderColor: (darkMode) ? colors.OFF_WHITE : colors.DIM_GRAY,
    borderStyle: "solid",
    borderWidth: 1,

    transform: [{
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 0.95],
      })
    }],
  }),
});