import Constants from "expo-constants";
import { useContext } from "react";
import { Image, Linking, StyleSheet, Text, View } from "react-native";
import AppIcon from "../assets/icon.png";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { ListGroup, ListRow } from "../components/ListGroup";
import SubpageContainer from "../components/SubpageContainer";

const PORTFOLIO_URL = "https://todoran.dev/";
const DONATE_URL = "https://www.paypal.com/donate/?business=5EGAWXCBNDGHC&no_recurring=0&item_name=Help+support+the+future+development+of+Crates+%26+Craters%21+If+you+have+any+suggestions+for+the+game%2C+please+reach+out+to+me%21&currency_code=USD";
const PRIVACY_URL = "https://github.com/StefanTodoran/crates-craters/blob/master/PRIVACYPOLICY.md";
const FEEDBACK_URL = "mailto:info@todoran.dev?subject=Crates%20%26%20Craters%20Feedback";

export default function About() {
  const { darkMode } = useContext(GlobalContext);
  const textColor = darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR;
  const version = Constants.expoConfig?.version;

  return (
    <SubpageContainer>
      <View style={styles.page}>
        <View style={styles.header}>
          {/* The icon art is transparent; the home screen shows it on white. */}
          <View style={styles.appIconTile}>
            <Image source={AppIcon} style={styles.appIcon} />
          </View>
          <Text style={[styles.appName, { color: textColor }]}>Crates & Craters</Text>
          {version && <Text style={styles.caption}>Version {version}</Text>}
        </View>

        <Text style={[styles.blurb, { color: textColor }]}>
          A passion project built and maintained by Stefan Todoran.
          Found a bug or have an idea? I'd love to hear it.
        </Text>

        <ListGroup>
          <ListRow title="Send Feedback" icon={graphics.MAIL_ICON_GREEN} onPress={() => Linking.openURL(FEEDBACK_URL)} />
          <ListRow title="Support C&C" icon={graphics.SUPPORT_ICON} onPress={() => Linking.openURL(DONATE_URL)} />
          <ListRow title="My Portfolio" icon={graphics.LOGO} onPress={() => Linking.openURL(PORTFOLIO_URL)} last />
        </ListGroup>

        <ListGroup>
          <ListRow title="Privacy Policy" icon={graphics.KEY} onPress={() => Linking.openURL(PRIVACY_URL)} last />
        </ListGroup>

        <Text style={[styles.caption, styles.credits]}>Sound effects courtesy of Mike Koenig.</Text>
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    paddingTop: normalize(24),
    paddingBottom: normalize(40),
  },
  header: {
    alignItems: "center",
    marginBottom: normalize(16),
  },
  appIconTile: {
    width: normalize(96),
    height: normalize(96),
    borderRadius: normalize(22),
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.3),
    overflow: "hidden",
    marginBottom: normalize(14),
  },
  appIcon: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(24),
    marginBottom: normalize(2),
  },
  caption: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(13),
    color: colors.DIM_GRAY,
  },
  blurb: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(15),
    lineHeight: normalize(22),
    textAlign: "center",
    marginBottom: normalize(24),
    paddingHorizontal: normalize(8),
  },
  credits: {
    textAlign: "center",
    marginTop: normalize(4),
  },
});
