import { StyleSheet, Dimensions, Platform, PixelRatio } from "react-native";
import { colors } from "./Theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SAMSUNG_S8_WIDTH = 384;
const scale = SCREEN_WIDTH / SAMSUNG_S8_WIDTH;

export function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 4;
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export default StyleSheet.create({
  paragraph: (darkMode) => ({
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    fontSize: normalize(16),
    marginBottom: normalize(10),
  }),

  bold: (darkMode) => ({
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(16),
    marginBottom: normalize(10),
    letterSpacing: 0.5,
  }),

  subtitle: (darkMode) => ({
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: normalize(20),
    marginBottom: normalize(8),
    marginTop: normalize(12),
  }),
});
