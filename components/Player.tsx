import { StyleSheet, Image, Animated } from "react-native";
import React, { useRef, useEffect, useMemo } from "react";
import { Direction, TileType } from "../util/types";
import { Game, boundTileAt } from "../util/logic";
import { colors, graphics } from "../Theme";

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
  }, []);

  const options = useMemo(() => {
    // We only add selectors on adjacent tiles where the player could actually move.
    const newOptions: JSX.Element[] = [];
    const offsets: Offset[] = [
      { dx: -1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
    ];

    offsets.forEach((offset, index) => {
      const shouldHighlight = shouldHighlightTile(game, offset);

      // It would make sense to not add the Animated.View if it isn't over a shouldHighlight tile.
      // However this results in the animation breaking sometimes, even if we add dummy Animated.View
      // with the same id. Oddly the dummy Animated.View with same id prevents some situations
      // which break the Animated.loop, but not all.
      const optionStyle = styles.optionTile(game.player.x + offset.dx, game.player.y + offset.dy, tileSize, optionsAnim, shouldHighlight, darkMode);
      newOptions.push(<Animated.View key={index} style={optionStyle}></Animated.View>);
    });

    return newOptions;
  }, [game, tileSize, darkMode]);

  const player_src = (darkMode) ? graphics.PLAYER_OUTLINED_DARK : graphics.PLAYER_OUTLINED;
  return (
    <>
      {!game.won && options}
      <Animated.View style={styles.player(game.player.x, game.player.y, tileSize, touch.x, touch.y)}>
        <Image style={styles.tile("#00000000", tileSize)} source={player_src} />
      </Animated.View>
    </>
  );
}

function shouldHighlightTile(game: Game, offset: Offset) {
  const xPos = game.player.x + offset.dx;
  const yPos = game.player.y + offset.dy;

  const tile = boundTileAt(yPos, xPos, game.board);
  if ([TileType.OUTSIDE, TileType.CRATER, TileType.WALL].includes(tile.id)) return false;

  if (tile.id === TileType.DOOR && game.keys === 0) return false;
  if (tile.id === TileType.FLAG && game.coins !== game.maxCoins) return false;
  
  if (tile.id === TileType.ONEWAY) {
    if (tile.orientation === Direction.LEFT && xPos > game.player.x) return false;
    if (tile.orientation === Direction.RIGHT && xPos < game.player.x) return false;
    if (tile.orientation === Direction.UP && yPos > game.player.y) return false;
    if (tile.orientation === Direction.DOWN && yPos < game.player.y) return false;
  }
  
  if (tile.id === TileType.CRATE || tile.id === TileType.BOMB) {
    const nextTile = boundTileAt(yPos + offset.dy, xPos + offset.dx, game.board);
    if (tile.id === TileType.CRATE && nextTile.id !== TileType.EMPTY && nextTile.id !== TileType.CRATER) return false;
    if (tile.id === TileType.BOMB && nextTile.id !== TileType.EMPTY) return false;
  }

  return true;
}

const styles = StyleSheet.create<any>({
  tile: (bgColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
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