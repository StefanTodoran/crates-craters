import { useContext } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import MenuButton from "../components/MenuButton";
import SubpageContainer from "../components/SubpageContainer";

export default function About() {
  const { darkMode } = useContext(GlobalContext);

  return (
    <SubpageContainer center>
      <Text style={TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR)}>
        Attribution
      </Text>

      <Text style={TextStyles.paragraph(darkMode)}>
        Crates & Craters is a passion project entirely built and maintained by Stefan Todoran.
        Sound effects courtesy of Mike Koenig.
      </Text>

      <Text style={TextStyles.paragraph(darkMode)}>
        If you're looking to check out some of my other work or get in contact, click the button below to go to my portfolio, then click the mail icon.
        Please also use that button if you encounter bugs or have any suggestions.
      </Text>

      <View style={styles.buttonsContainer}>
        <MenuButton
          onPress={() => { Linking.openURL("https://todoran.dev/") }}
          label="My Portfolio"
          icon={graphics.LOGO}
          theme={colors.GREEN_THEME}
          fillWidth
        />
        <MenuButton
          onPress={() => { Linking.openURL("https://www.paypal.com/donate/?business=5EGAWXCBNDGHC&no_recurring=0&item_name=Help+support+the+future+development+of+Crates+%26+Craters%21+If+you+have+any+suggestions+for+the+game%2C+please+reach+out+to+me%21&currency_code=USD") }}
          label="Support C&C"
          icon={graphics.SUPPORT_ICON}
          theme={colors.GREEN_THEME}
          fillWidth
        />
        <MenuButton
          onPress={() => { Linking.openURL("https://github.com/StefanTodoran/crates-craters/blob/master/PRIVACYPOLICY.md") }}
          label="Privacy Policy"
          icon={graphics.KEY}
          theme={colors.GREEN_THEME}
          fillWidth
        />
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: "20%",
    marginBottom: normalize(32),
  },
});