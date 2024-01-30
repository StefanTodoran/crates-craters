import { Text, Image, ImageURISource, Dimensions, Pressable, StyleSheet } from "react-native";
import TextStyles, { normalize } from "../TextStyles";

const win = Dimensions.get("window");

interface Props {
  icon: ImageURISource,
  text: string,
  callback: () => void,
  darkMode: boolean,
}

export default function MenuPage({
  icon,
  text,
  callback,
  darkMode,
}: Props) {
  return (
    <Pressable style={styles.body} onPress={callback}>
      <Image
        resizeMode={"contain"}
        style={styles.icon}
        source={icon}
      />
      <Text style={[
        TextStyles.paragraph(darkMode),
        styles.text,
      ]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create<any>({
  body: {
    height: win.height,
    width: win.width,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    maxWidth: win.width * 0.65,
    maxHeight: win.width * 0.65,
  },
  text: {
    textShadowColor: "#000",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
    color: "white",
    fontSize: normalize(40),
    marginBottom: win.height / 6,
  },
});