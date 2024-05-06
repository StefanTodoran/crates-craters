import { Text, StyleSheet, Dimensions, Linking, View } from "react-native";
import { useContext } from "react";

import { colors, graphics } from "../Theme";
import MenuButton from "../components/MenuButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import SubpageContainer from "../components/SubpageContainer";
const win = Dimensions.get("window");

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
        If you're looking to check out some of my other work or get in contact, click the button below.
        Please also use that button if you encounter any bugs or have any suggestions.
      </Text>

      <Text style={TextStyles.paragraph(darkMode)}>
        It links to my portfolio website. Click the mail icon to scroll to the contact section at the bottom of the page.
      </Text>

      <View style={styles.buttonsContainer}>
        <MenuButton
          onPress={() => { Linking.openURL("https://todoran.dev/") }}
          label="My Portfolio"
          icon={graphics.LOGO}
          theme={colors.GREEN_THEME}
        />
        <MenuButton
          onPress={() => { Linking.openURL("https://www.paypal.com/donate/?business=5EGAWXCBNDGHC&no_recurring=0&item_name=Help+support+the+future+development+of+Crates+%26+Craters%21+If+you+have+any+suggestions+for+the+game%2C+please+reach+out+to+me%21&currency_code=USD") }}
          label="Support C&C"
          icon={graphics.SUPPORT_ICON}
          theme={colors.GREEN_THEME}
        />
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    marginBottom: normalize(32),
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
});