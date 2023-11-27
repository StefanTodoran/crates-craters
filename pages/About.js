import { Text, StyleSheet, Dimensions, Linking, View, ScrollView } from "react-native";
import React, { useContext } from "react";

import { colors, graphics } from "../Theme";
import MenuButton from "../components/MenuButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
const win = Dimensions.get("window");

export default function About() {
  const { darkMode } = useContext(GlobalContext);

  const MenuButtonRecolor = {
    borderColor: colors.MAIN_GREEN,
    textColor: colors.MAIN_GREEN,
    backgroundColor: colors.GREEN_OFF_WHITE,
    darkModeBackgroundColor: colors.MAIN_GREEN_TRANSPARENT(0.1),
    pressedColor: colors.MAIN_GREEN_TRANSPARENT(0.3),
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{
      paddingHorizontal: win.width * 0.05,
      paddingTop: win.height * 0.015,
      paddingBottom: win.height * 0.025,
      justifyContent: "center",
      height: "100%",
    }} overScrollMode="never" showsVerticalScrollIndicator={false}>
      <Text style={TextStyles.subtitle(darkMode, colors.MAIN_GREEN)}>
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
          label="Stefan Todoran"
          icon={graphics.LOGO}
          {...MenuButtonRecolor}
          />
        <MenuButton
          onPress={() => { Linking.openURL("https://www.paypal.com/donate/?business=5EGAWXCBNDGHC&no_recurring=0&item_name=Help+support+the+future+development+of+Crates+%26+Craters%21+If+you+have+any+suggestions+for+the+game%2C+please+reach+out+to+me%21&currency_code=USD") }}
          label="Support C&C"
          icon={graphics.SUPPORT_ICON}
          {...MenuButtonRecolor}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    paddingHorizontal: win.width * 0.175, // 0.225 - 0.05
    marginBottom: normalize(32),
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  scrollContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    overflow: "hidden",
  }
});