import { Text, StyleSheet, Image, Dimensions, View } from 'react-native';
import React from "react";
import Colors from '../Colors';
import MenuButton from '../components/MenuButton';
import PortfolioButton from '../components/PortfolioButton';

export default function About({ pageCallback, darkMode, darkModeCallback }) {
  return (
    <>
      <Image style={styles.banner} source={require('../assets/about_banner.png')} />

      <Text style={styles.text(darkMode)}>
        Crates & Craters is a passion project entirely built and maintained by Stefan Todoran.
      </Text>

      <Text style={styles.text(darkMode)}>
        If you're looking to check out some of my other work or get in contact, click the button below.
        Please also use that button if you encounter any bugs or have any suggestions.
      </Text>
      
      <Text style={styles.text(darkMode)}>
        It links to my portfolio website, but if you scroll to the very bottom there is a contact link. The mail icon also takes you right there.
      </Text>

      <View style={styles.row}>
        <Image style={styles.icon} source={require('../assets/mail_1.png')} />
        <Image style={styles.icon} source={require('../assets/mail_2.png')} />
      </View>

      <PortfolioButton />
      <MenuButton onPress={darkModeCallback} value={null} label="Toggle Dark Mode" icon={require('../assets/night_mode.png')} />
      <MenuButton onPress={pageCallback} value="home" label="Back to Menu" icon={require('../assets/door.png')} />
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
    width: sizeFromWidthPercent(0.6, 146, 299)[0],
    height: sizeFromWidthPercent(0.6, 146, 299)[1],
  },
  text: darkMode => ({
    maxWidth: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? Colors.MAIN_BLUE : Colors.DARK_BLUE,
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