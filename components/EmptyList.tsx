import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PageView } from "../util/types";
import { doPageChange } from "../util/events";
import { colors, graphics } from "../Theme";
import MenuButton from "./MenuButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";

interface Props {
  mode: PageView.LEVELS | PageView.MANAGE,
  refreshCallback?: () => void,
}

export default function EmptyList({ mode, refreshCallback }: Props) {
  const { darkMode } = useContext(GlobalContext);

  if (mode === PageView.LEVELS) return (
    <View style={styles.container}>
      <Text style={TextStyles.paragraph(darkMode)}>Levels not downloaded yet!</Text>
      <Text style={TextStyles.paragraph(darkMode)}>Check your internet connection, then try again.</Text>
      <MenuButton
        onPress={refreshCallback}
        label="Retry Download"
        icon={graphics.CRATE}
      />
      <View style={styles.padding}/>
    </View>
  );

  if (mode === PageView.MANAGE) return (
    <View style={styles.container}>
      <Text style={TextStyles.paragraph(darkMode)}>No custom levels created yet!</Text>
      <MenuButton
        onPress={() => doPageChange(2)}
        label="Create New Level"
        icon={graphics.METAL_CRATE}
        theme={colors.RED_THEME}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "22.5%",
    width: "100%",
  },
  padding: {
    height: normalize(80),
  }
});