import { useContext, useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import BackButton from "../assets/BackButton";
import GameBoard from "../components/GameBoard";
import Inventory from "../components/Inventory";
import MoveCounter from "../components/MoveCounter";
import SimpleButton from "../components/SimpleButton";
import SliderBar from "../components/SliderBar";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors } from "../Theme";
import { useSoundEventPlayers } from "../util/hooks";
import { doGameMove, Game, initializeGameObj, Position, SoundEvent } from "../util/logic";
import { PageView, TileType, UserLevel } from "../util/types";

interface Props {
  viewCallback: (newView: PageView, pageNum?: number) => void, // Sets the current view of the application. 
  level: UserLevel, // The level currently being edited. The uuid must not change.
}

export default function ViewSolution({
  viewCallback,
  level,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [currentMove, setCurrentMove] = useState(0);
  const playSoundEvent = useSoundEventPlayers();

  // Replay solution moves to generate all game states.
  const allGameStates = useMemo(() => {
    const states: Game[] = [];
    if (!level.bestSolution) return states;

    let game = initializeGameObj(level);
    let prevPosition = addPlayerToBoard(game);
    states.push(game);

    for (let i = 0; i < level.bestSolution.length; i++) {
      const move = parseInt(level.bestSolution[i]);
      [game] = doGameMove(game, move);
      prevPosition = addPlayerToBoard(game, prevPosition);
      states.push(game);
    }

    return states;
  }, [level]);

  useEffect(() => {
    if (allGameStates.length === 0) return;

    // Fill in undefined sound events (first move and final move won't have sound events but we want some here).
    let soundEvent = allGameStates[currentMove].soundEvent;
    if (soundEvent === undefined) soundEvent = SoundEvent.MOVE;

    playSoundEvent(soundEvent);
  }, [currentMove]);

  if (!level.bestSolution) {
    return <Text style={[TextStyles.subtitle(darkMode), { color: colors.MAIN_PURPLE }]}>
      No solution found!
    </Text>;
  }

  const currentGameState = allGameStates[currentMove];

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <MoveCounter moveCount={currentGameState.moveHistory.length} />
        <GameBoard board={currentGameState.board} />
        <Inventory coins={currentGameState.coins} maxCoins={currentGameState.maxCoins} keys={currentGameState.keys} />
      </View>

      <View style={{ height: normalize(15) }} />
      <SliderBar
        label="Move" value={currentMove} units={""}
        minValue={0} maxValue={level.bestSolution.length} changeCallback={setCurrentMove}
        showSteppers
      />

      <View style={styles.buttonsRow}>
        <SimpleButton onPress={() => {
          viewCallback(PageView.MANAGE, 1);
        }} text="Back" Svg={BackButton} />
      </View>
    </SafeAreaView>
  );
}

function addPlayerToBoard(game: Game, prevPosition: Position | undefined = undefined) {
  if (prevPosition) {
    game.board.setTile(prevPosition.y, prevPosition.x, { id: TileType.EMPTY });
  }
  game.board.setTile(game.player.y, game.player.x, { id: TileType.SPAWN });
  return game.player;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  buttonsRow: {
    flexDirection: "row",
    height: normalize(50),
    marginTop: normalize(15),
  },
});