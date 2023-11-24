import { Text, Image, ImageURISource, Dimensions, Pressable } from "react-native";
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
      <Text style={styles.text(darkMode)}>{text}</Text>
    </Pressable>
  );
}

const styles: any = {
  body: {
    height: win.height,
    width: win.width,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    maxWidth: win.width * 0.95,
    maxHeight: win.width * 0.95,
  },
  text: (darkMode: boolean) => ({
    // @ts-expect-error
    ...TextStyles.paragraph(darkMode),
    textShadowColor: "black",
    textShadowRadius: 2,
    color: "white",
    fontSize: normalize(40),
  }),
};