import { UserCredential } from "firebase/auth";
import { useContext, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import CartIcon from "../assets/main_theme/cart.png";
import ProfileIcon from "../assets/main_theme/profile.png";
import SubpageContainer from "../components/SubpageContainer";
import Subpages from "../components/Subpages";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { useCoinBalance } from "../util/loader";
import ProfilePage from "./ProfilePage";

interface Props {
  attemptSignIn: () => Promise<void>,
  setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function StorePage({ attemptSignIn, setUserCredential }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const [balance, _modifyBalance] = useCoinBalance();

  const pageComponents = useMemo(() => {
    return [
      <ProfilePage attemptSignIn={attemptSignIn} setUserCredential={setUserCredential} />,
      <SubpageContainer center>
        <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
          Coming Soon
        </Text>

        <Text style={TextStyles.paragraph(darkMode)}>
          A way to spend your accumulated coins is in the works and coming soon!
        </Text>

        <View style={styles.row}>
          <Text allowFontScaling={false} style={[TextStyles.paragraph(darkMode), styles.coinsText]}>{balance}</Text>
          <Image style={styles.icon} source={graphics.COIN} />
        </View>
      </SubpageContainer>,
    ];
  }, []);

  const pageTabs = useMemo(() => {
    return [
      {
        label: "Profile",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: ProfileIcon,
      },
      {
        label: "Store",
        color: colors.YELLOW_THEME.MAIN_COLOR,
        icon: CartIcon,
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