import { View, StatusBar } from "react-native";
import Banner from "./Banner";
import HomeButton from "./HomeButton";
import { PageView } from "../util/types";

interface Props {
  pageView: PageView,
  returnHome: () => void,
}

export enum PageTheme {
  PURPLE,
  RED,
  YELLOW,
  GREEN,
  NONE,
}

export interface PageThemeColors {
  OFF_WHITE: string,
  LIGHT_COLOR: string,
  MAIN_COLOR: string,
  MIDDLE_COLOR: string,
  DARK_COLOR: string,
  NEAR_BLACK: string,
}

const pageThemeColors: PageThemeColors[] = [
  { // Purple
    OFF_WHITE: "#FEFAFF",
    LIGHT_COLOR: "#F9F0FC",
    MAIN_COLOR: "#CCB7E5",
    MIDDLE_COLOR: "#BEA9DF",
    DARK_COLOR: "#B19CD8",
    NEAR_BLACK: "#15101A",
  },
  { // Orange
    OFF_WHITE: "#FFFDFC",
    LIGHT_COLOR: "#FFF2F0",
    MAIN_COLOR: "#F7B69B",
    MIDDLE_COLOR: "#F9A784",
    DARK_COLOR: "#FB976C",
    NEAR_BLACK: "#170F0D", //"#0E0A09",
  },
  { // Orange
    OFF_WHITE: "#FFFDFC",
    LIGHT_COLOR: "#FFF2F0",
    MAIN_COLOR: "#F7B69B",
    MIDDLE_COLOR: "#F9A784",
    DARK_COLOR: "#FB976C",
    NEAR_BLACK: "#170F0D",
  },
  { // Green
    OFF_WHITE: "#fafffa",
    LIGHT_COLOR: "#eefcee",
    MAIN_COLOR: "#b8e5b9",
    MIDDLE_COLOR: "#9BD99D",
    DARK_COLOR: "#8AD092",
    NEAR_BLACK: "#0E160E",
  },
];

export function pageViewToPageTheme(pageView: PageView) {
  switch (pageView) {
    case PageView.LEVELS:
      return PageTheme.PURPLE;
    case PageView.EDIT:
      return PageTheme.RED;
    case PageView.STORE:
      return PageTheme.YELLOW;
    case PageView.SETTINGS:
      return PageTheme.GREEN;

    default:
      return PageTheme.NONE;
  }
}

export default function Header({ pageView, returnHome }: Props) {
  const pageTheme = pageViewToPageTheme(pageView);
  const themeColors = pageThemeColors[pageTheme];

  if (pageTheme === PageTheme.NONE) return <></>;
  return (
    <>
      <Banner useTheme={themeColors} widthPercent={90} />

      <View style={styles.menuButton}>
        <HomeButton
          color={themeColors.DARK_COLOR}
          onPress={returnHome}
        />
      </View>
    </>
  );
}

const styles: any = {
  menuButton: {
    position: "absolute",
    top: StatusBar.currentHeight!,
    right: "3%",
  },
};