import { StyleSheet, Dimensions, Platform, PixelRatio, ViewStyle, ImageStyle, TextStyle } from "react-native";
import { colors } from "./Theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SAMSUNG_S8_WIDTH = 384;
const scale = SCREEN_WIDTH / SAMSUNG_S8_WIDTH;

export function normalize(size: number) {
  const newSize = size * scale;
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 4;
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

export function sizeFromWidthPercent(percent: number, width: number, height: number) {
  const fraction = percent / 100;
  const ratio = SCREEN_WIDTH * fraction / width;
  return {
    width: Math.round(SCREEN_WIDTH * fraction),
    height: Math.round(ratio * height),
  };
}

type Style = ViewStyle | ImageStyle | TextStyle;

interface TextStyles {
  paragraph: (darkMode: boolean) => Style;
  bold: (darkMode: boolean) => Style;
  subtitle: (darkMode: boolean, colorOverride?: string) => Style;
}

// @ts-expect-error
export default StyleSheet.create<TextStyles>({
  paragraph: (darkMode) => ({
    color: (darkMode) ? colors.OFF_WHITE : colors.TEXT_COLOR,
    // color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
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

  subtitle: (darkMode, colorOverride) => ({
    color: (colorOverride) ? colorOverride : ((darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: normalize(20),
    marginBottom: normalize(8),
    marginTop: normalize(12),
  }),
});
