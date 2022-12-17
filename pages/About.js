import { Text, StyleSheet, Image, Dimensions, View, Linking } from 'react-native';
import React from "react";

import { colors, graphics, nextTheme } from '../Theme';
import MenuButton from '../components/MenuButton';

export default function About({ pageCallback, darkMode, darkModeCallback, setThemeCallback }) {
  return (
    <>
      <Image style={styles.banner} source={graphics.ABOUT_BANNER} />

      <Text style={styles.text(darkMode)}>
        Crates & Craters is a passion project entirely built and maintained by Stefan Todoran.
        Sound effects courtesy of Mike Koenig.
      </Text>

      <Text style={styles.text(darkMode)}>
        If you're looking to check out some of my other work or get in contact, click the button below.
        Please also use that button if you encounter any bugs or have any suggestions.
      </Text>

      <Text style={styles.text(darkMode)}>
        It links to my portfolio website. Click the mail icon to scroll to the contact section at the bottom of the page.
      </Text>

      {/* <View style={styles.row}>
        <Image style={styles.icon} source={require('../assets/mail_1.png')} />
        <Image style={styles.icon} source={require('../assets/mail_2.png')} />
      </View> */}

      <MenuButton onPress={(url) => { Linking.openURL(url) }} value={"https://todoran.dev/"}
        label="Stefan Todoran" icon={graphics.LOGO} />
      <MenuButton onPress={darkModeCallback} value={null} label="Toggle Dark Mode" icon={graphics.NIGHT_MODE_ICON} />
      <MenuButton onPress={() => {
        const newTheme = nextTheme();
        setThemeCallback(newTheme);
      }} value={null} label="Change App Theme" icon={graphics.THEME_ICON} />
      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={graphics.DOOR} />
    </>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
const win = Dimensions.get('window');
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.5, 146, 299)[0],
    height: sizeFromWidthPercent(0.5, 146, 299)[1],
  },
  text: darkMode => ({
    width: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  icon: {
    height: 40,
    width: 40,
    marginHorizontal: 10,
  }
});