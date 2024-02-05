import { Text, Image, ImageURISource, Dimensions, Pressable, StyleSheet, View } from "react-native";
import { normalize } from "../TextStyles";

const win = Dimensions.get("window");

interface Props {
  icon: ImageURISource,
  text: string,
  callback: () => void,
  updates: number,
  // color: string,
  darkColor: string,
}

export default function MenuPage({
  icon,
  text,
  callback,
  updates,
  // color,
  darkColor,
}: Props) {
  return (
    <Pressable style={styles.body} onPress={callback}>
      <Image
        resizeMode={"contain"}
        style={styles.icon}
        source={icon}
      />

      <View style={styles.textContainer}>
        <Text style={[styles.text, { textShadowColor: darkColor }]}>
          {text}
        </Text>

        {updates > 0 && <>
          <Text style={[
            styles.notification,
            {
              top: 1,
              color: darkColor,
              borderColor: darkColor,
            }
          ]}>
            {updates}
          </Text>
          <Text style={styles.notification}>
            {updates}
          </Text>
        </>}
      </View>
    </Pressable>
  );
}

const notificationFontSize = normalize(14);
const notificationBodySize = notificationFontSize * 1.6;

const styles = StyleSheet.create({
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
  textContainer: {
    position: "relative",
    marginBottom: win.height / 6,
  },
  text: {
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    textShadowRadius: 3,
    textShadowOffset: { width: 0, height: 1 },
    color: "white",
    fontSize: normalize(40),
  },
  notification: {
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    position: "absolute",
    // backgroundColor: "white",
    // color: "black",
    color: "#fff",
    borderColor: "#fff",
    borderWidth: 2,
    fontSize: notificationFontSize,
    height: notificationBodySize,
    width: notificationBodySize,
    borderRadius: notificationBodySize / 2,
    textAlign: "center",
    textAlignVertical: "center",
    top: 0,
    right: -notificationBodySize,
  },
});