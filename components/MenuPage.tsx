import { Image, ImageURISource, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { normalize } from "../TextStyles";

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
  const win = useWindowDimensions();
  return (
    <Pressable style={[styles.body, { height: win.height, width: win.width }]} onPress={callback}>
      <Image
        resizeMode={"contain"}
        style={{ maxWidth: win.width * 0.65, maxHeight: win.width * 0.65 }}
        source={icon}
      />

      <View style={[styles.textContainer, { marginBottom: win.height / 6 }]}>
        <Text style={[styles.text, { textShadowColor: darkColor }]}>
          {text}
        </Text>

        {updates > 0 && <>
          <View style={[styles.notificationShadow, { backgroundColor: darkColor }]}/>
          <Text style={[styles.notification, { color: darkColor }]}>
            {updates > 1 ? updates : "!"}
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
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    position: "relative",
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
    backgroundColor: "white",
    fontSize: notificationFontSize,
    height: notificationBodySize,
    width: notificationBodySize,
    borderRadius: notificationBodySize / 2,
    textAlign: "center",
    textAlignVertical: "center",
    top: 0,
    right: -notificationBodySize,
  },
  notificationShadow: {
    position: "absolute",
    backgroundColor: "black",
    height: notificationBodySize,
    width: notificationBodySize,
    borderRadius: notificationBodySize / 2,
    opacity: 0.75,
    top: 1,
    right: -notificationBodySize,
  },
});