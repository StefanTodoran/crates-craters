import { StatusBar, StyleSheet, View } from "react-native";
import { colors, purpleTheme } from "../Theme";
import { PageView } from "../util/types";
import Banner from "./Banner";
import HomeButton from "./HomeButton";
import SkipDownButton from "./SkipDownButton";

interface Props {
  pageView: PageView,
  returnHome: () => void,
  scrollToBottom: () => void,
}

export enum PageTheme {
  PURPLE,
  RED,
  YELLOW,
  GREEN,
  NONE,
}

import GreenBanner from "../assets/green_banner.png";
import PurpleBanner from "../assets/purple_banner.png";
import RedBanner from "../assets/red_banner.png";
import YellowBanner from "../assets/yellow_banner.png";

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

export default function Header({ pageView, returnHome, scrollToBottom }: Props) {
  const pageTheme = pageViewToPageTheme(pageView);
  const theme = pageThemeData[pageTheme];

  if (pageTheme === PageTheme.NONE) return <></>;
  return (
    <>
      <Banner bannerImage={theme.banner} widthPercent={90} />

      {pageView === PageView.LEVELS && <View style={styles.leftMenuButton}>
        <SkipDownButton
          color={theme.color}
          onPress={scrollToBottom}
        />
      </View>}
      <View style={styles.rightMenuButton}>
        <HomeButton
          color={theme.color}
          onPress={returnHome}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  leftMenuButton: {
    position: "absolute",
    top: StatusBar.currentHeight!,
    left: "3%",
  },
  rightMenuButton: {
    position: "absolute",
    top: StatusBar.currentHeight!,
    right: "3%",
  },
});