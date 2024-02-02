import { StyleSheet, Image, Animated } from "react-native";
import React, { useRef, useEffect, useMemo } from "react";
import { Direction, TileType } from "../util/types";
import { Game, boundTileAt } from "../util/logic";
import { colors, graphics } from "../Theme";

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
  }, []);

  const options = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: JSX.Element[] = [];
    const offsets = [
      {dx: -1, dy: 0},
      {dx: 0, dy: -1},
      {dx: 1, dy: 0},
      {dx: 0, dy: 1},
    ];

    offsets.forEach((offset, index) => {
      const xPos = game.player.x + offset.dx;
      const yPos = game.player.y + offset.dy;

      const tile = boundTileAt(yPos, xPos, game.board);
      let selectable = ![TileType.OUTSIDE, TileType.CRATER, TileType.WALL].includes(tile.id);
      selectable = (tile.id === TileType.DOOR && game.keys === 0) ? false : selectable;
      selectable = (tile.id === TileType.FLAG && game.coins !== game.maxCoins) ? false : selectable;

      if (tile.id === TileType.ONEWAY) {
        selectable = (tile.orientation === Direction.LEFT && xPos > game.player.x) ? false : selectable;
        selectable = (tile.orientation === Direction.RIGHT && xPos < game.player.x) ? false : selectable;
        selectable = (tile.orientation === Direction.UP && yPos > game.player.y) ? false : selectable;
        selectable = (tile.orientation === Direction.DOWN && yPos < game.player.y) ? false : selectable;
      }

      if (selectable) {
        const optionStyle = styles.optionTile(xPos, yPos, tileSize, optionsAnim, darkMode);
        newOptions.push(<Animated.View key={index} style={optionStyle}></Animated.View>);
      } else {
        newOptions.push(<Animated.View key={index}></Animated.View>);
      }
    });

    return newOptions;
  }, [game, tileSize, darkMode]);

  const player_src = (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;
  return (
    <>
      {!game.won && options}
      <Animated.View style={{
        ...styles.player(game.player.x, game.player.y, tileSize, touch.x, touch.y),
        // ...styles.player(
        //   game.player.x, game.player.y,
        //   tileSize,
        //   touch.magX, touch.magY,
        //   touch.dirX, touch.dirY,
        // ),
      }}>
        <Image style={styles.tile("#00000000", tileSize)} source={player_src} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  tile: (bgColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
  /*
    player: (xPos, yPos, tileSize, magX, magY, dirX, dirY) => ({
      position: "absolute",
      left: xPos * tileSize,
      top: yPos * tileSize,
      transform: [
        {
          translateY: magY > tileSize ? dirY * tileSize : dirY * magY
        },
        {
          translateX: magX > tileSize ? dirX * tileSize : dirX * magX
        },
      ],
    }),
  */
  player: (xPos: number, yPos: number, tileSize: number, touchX: number, touchY: number) => ({
    position: "absolute",
    left: xPos * tileSize,
    top: yPos * tileSize,
    transform: [
      {
        translateY: Math.abs(touchY) > tileSize ? Math.sign(touchY) * tileSize : touchY
      },
      {
        translateX: Math.abs(touchX) > tileSize ? Math.sign(touchX) * tileSize : touchX
      },
    ],
  }),
  optionTile: (xPos: number, yPos: number, size: number, anim: Animated.Value, darkMode: boolean) => ({
    position: "absolute",
    left: xPos * size,
    top: yPos * size,
    width: size,
    height: size,
    opacity: anim.interpolate({ // was originally static 0.4
      inputRange: [0, 1],
      outputRange: [0.75, 0.3],
      // outputRange: [0.5, 0.2],
    }),

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