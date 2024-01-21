import { useContext } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { useCoinBalance } from "../util/loader";

interface Props {

}

export default function ({ }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [balance, modifyBalance] = useCoinBalance();
  
  return (
    <>
      <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
        Coming Soon
      </Text>

      <View style={styles.row}>
        <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), styles.coinsText]}>{balance}</Text>
        <Image style={styles.icon} source={graphics.COIN} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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