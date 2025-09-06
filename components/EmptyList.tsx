import { useContext } from "react";
import { ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles from "../TextStyles";
import { Theme } from "../Theme";
import MenuButton from "./MenuButton";

export interface EmptyListProps {
  textLines: string[],
  onPress?: () => void,
  buttonLabel?: string,
  buttonIcon?: ImageSourcePropType,
  buttonTheme?: Theme,
}

export default function EmptyList({
  textLines,
  onPress,
  buttonLabel,
  buttonIcon,
  buttonTheme,
}: EmptyListProps) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <View style={styles.container}>
      {textLines.map((line, index) => (
        <Text key={index} style={[TextStyles.paragraph(darkMode), { textAlign: "center" }]}>
          {line}
        </Text>
      ))}
      <View style={styles.buttonWrap}>
        {buttonLabel && <MenuButton
          onPress={onPress}
          label={buttonLabel}
          icon={buttonIcon}
          theme={buttonTheme}
        />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "11.25%",
    paddingVertical: "11.25%",
    flex: 1,
  },
  buttonWrap: {
    paddingHorizontal: "11.25%",
  },
});