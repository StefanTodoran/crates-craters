import { useAudioPlayer } from "expo-audio";
import { useContext, useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { graphics } from "../Theme";

const coinSound = require("../assets/audio/coin.wav");

interface Props {
  currentBalance: number;
  startingBalance?: number;
}

export default function CoinsBalance({ currentBalance, startingBalance }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const coinSoundPlayer = useAudioPlayer(coinSound);

  const [shownBalance, setShownBalance] = useState(startingBalance !== undefined ? startingBalance : currentBalance);
  const balancePercentage = shownBalance / currentBalance;

  const coinsAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    coinsAnim.setValue(0);
    Animated.timing(coinsAnim, {
      toValue: 1,
      duration: 125,
      useNativeDriver: true
    }).start(() => {
      if (shownBalance < currentBalance) {
        setShownBalance(shownBalance + 1);
        coinSoundPlayer.seekTo(0);
        coinSoundPlayer.play();
      }
    });
  }, [shownBalance]);

  return (
    <Animated.View style={[
      styles.row,
      {
        transform: [{
          scale: coinsAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, balancePercentage],
          }),
        }]
      },
    ]}>
      <Text allowFontScaling={false} style={[
        TextStyles.paragraph(darkMode),
        styles.coinsText,
      ]}>{startingBalance !== undefined ? "+" : ""}{shownBalance}</Text>
      <Image style={styles.icon} source={graphics.COIN} />
    </Animated.View>
  );
}

const styles = StyleSheet.create<any>({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    height: normalize(40),
    width: normalize(40),
  },
  coinsText: {
    marginBottom: 0,
    fontSize: normalize(25),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
});