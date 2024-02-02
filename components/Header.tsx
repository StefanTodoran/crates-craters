import { View, StatusBar, StyleSheet } from "react-native";
import { PageView } from "../util/types";
import { colors, purpleTheme } from "../Theme";

import Banner from "./Banner";
import HomeButton from "./HomeButton";

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

import PurpleBanner from "../assets/purple_banner.png";
import RedBanner from "../assets/red_banner.png";
import YellowBanner from "../assets/yellow_banner.png";
import GreenBanner from "../assets/green_banner.png";

const pageThemeData = [
  { // Purple
    color: purpleTheme.MIDDLE_COLOR,
    banner: PurpleBanner,
  },
  { // Red
    color: colors.RED_THEME.MIDDLE_COLOR,
    banner: RedBanner,
  },
  { // Yellow    
    color: colors.YELLOW_THEME.MIDDLE_COLOR,
    banner: YellowBanner,
  },
  { // Green
    color: colors.GREEN_THEME.MIDDLE_COLOR,
    banner: GreenBanner,
  },
];

export function pageViewToPageTheme(pageView: PageView) {
  switch (pageView) {
    case PageView.LEVELS:
      return PageTheme.PURPLE;
    case PageView.MANAGE:
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
  const theme = pageThemeData[pageTheme];

  if (pageTheme === PageTheme.NONE) return <></>;
  return (
    <>
      <Banner bannerImage={theme.banner} widthPercent={90} />

      <View style={styles.menuButton}>
        <HomeButton
          color={theme.color}
          onPress={returnHome}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  menuButton: {
    position: "absolute",
    top: StatusBar.currentHeight!,
    right: "3%",
  },
});