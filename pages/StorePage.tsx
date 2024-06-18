import { useContext, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { useCoinBalance } from "../util/loader";

import Subpages from "../components/Subpages";
import ProfilePage from "./ProfilePage";

import CartIcon from "../assets/main_theme/cart.png";
import ProfileIcon from "../assets/main_theme/profile.png";

interface Props {
  //
}

export default function StorePage({}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [balance, _modifyBalance] = useCoinBalance();

  const pageComponents = useMemo(() => {
    return [
      <>
        <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
          Coming Soon
        </Text>

        <View style={styles.row}>
          <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), styles.coinsText]}>{balance}</Text>
          <Image style={styles.icon} source={graphics.COIN} />
        </View>
      </>,
      <ProfilePage />,
    ];
  }, []);

  const pageTabs = useMemo(() => {
    return [
      {
        label: "Store",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: CartIcon,
      },
      {
        label: "Profile",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: ProfileIcon,
      },
    ];
  }, []);

  return (
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs} />
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