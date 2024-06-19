import { useContext } from "react";
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import { Theme } from "../Theme";
import MenuButton from "./MenuButton";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";

export interface EmptyListProps {
  textLines: string[],
  padBottom?: boolean,
  onPress?: () => void,
  buttonLabel?: string,
  buttonIcon?: ImageSourcePropType,
  buttonTheme?: Theme,
}

export default function EmptyList({ 
  textLines,
  padBottom,
  onPress,
  buttonLabel,
  buttonIcon,
  buttonTheme,
}: EmptyListProps) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <View style={styles.container}>
      {textLines.map((line, idx) => <Text key={idx} style={TextStyles.paragraph(darkMode)}>{line}</Text>)}
      {buttonLabel && <MenuButton
        onPress={onPress}
        label={buttonLabel}
        icon={buttonIcon}
        theme={buttonTheme}
      />}
      {padBottom && <View style={styles.padding}/>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "22.5%",
    flex: 1,
  },
  padding: {
    height: normalize(80),
  }
});