import { Dimensions, PixelRatio, Platform, TextStyle } from "react-native";
import { colors } from "./Theme";

const SAMSUNG_S8_WIDTH = 384;
// Read on each call, so sizes computed during render follow window size changes
// (module-level StyleSheets still use the size at launch).
const screenWidth = () => Dimensions.get("window").width;

// Sizes were tuned on Android, and iOS renders the same font size larger. These replace
// a flat 4pt (iOS) / 2pt (Android) subtraction, which shrank small sizes to nothing
// (normalize(4) was about 0); they match the old sizes in the common 16-30 range.
const PLATFORM_FACTOR = Platform.OS === "ios" ? 0.85 : 0.92;

/** Scales a size designed for a 384pt-wide screen to this screen's width. */
export function normalize(size: number) {
  return PixelRatio.roundToNearestPixel(size * (screenWidth() / SAMSUNG_S8_WIDTH) * PLATFORM_FACTOR);
}

export function sizeFromWidthPercent(percent: number, width: number, height: number) {
  const fraction = percent / 100;
  const ratio = screenWidth() * fraction / width;
  return {
    width: Math.round(screenWidth() * fraction),
    height: Math.round(ratio * height),
  };
}

// Style functions (not a StyleSheet, whose values must be plain styles), typed so
// mistakes in them are caught.
export default {
  paragraph: (darkMode: boolean): TextStyle => ({
    color: (darkMode) ? colors.OFF_WHITE : colors.TEXT_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    fontSize: normalize(16),
    marginBottom: normalize(10),
  }),
  
  colored: (darkMode: boolean): TextStyle => ({
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
  }),

  bold: (darkMode: boolean): TextStyle => ({
    color: (darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    fontSize: normalize(16),
    marginBottom: normalize(10),
    letterSpacing: 0.5,
  }),

  subtitle: (darkMode: boolean, colorOverride?: string): TextStyle => ({
    color: (colorOverride) ? colorOverride : ((darkMode) ? colors.MAIN_PURPLE : colors.DARK_PURPLE),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: normalize(20),
    marginBottom: normalize(8),
    marginTop: normalize(12),
  }),
};
