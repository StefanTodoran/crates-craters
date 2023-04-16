import { Text, StyleSheet, Dimensions, Linking, View } from 'react-native';
import React, { useContext } from "react";

import { graphics } from '../Theme';
import MenuButton from '../components/MenuButton';
import { GlobalContext } from '../GlobalContext';
import TextStyles from '../TextStyles';
const win = Dimensions.get('window');

export default function About({ pageCallback }) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <>
      <View style={{width: win.width * 0.8}}>
        <Text style={TextStyles.subtitle(darkMode)}>
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
      </View>

      <View style={styles.buttonsContainer}>
        <MenuButton onPress={(url) => { Linking.openURL(url) }} value={"https://todoran.dev/"}
          label="Stefan Todoran" icon={graphics.LOGO} />
        <MenuButton onPress={(url) => { Linking.openURL(url) }} value={"https://www.paypal.com/donate/?business=5EGAWXCBNDGHC&no_recurring=0&item_name=Help+support+the+future+development+of+Crates+%26+Craters%21+If+you+have+any+suggestions+for+the+game%2C+please+reach+out+to+me%21&currency_code=USD"}
          label="Support C&C" icon={graphics.SUPPORT_ICON} />
        <MenuButton onPress={pageCallback} value={false} label="Back to Menu" icon={graphics.DOOR_ICON} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: win.width * 0.55,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  }
});