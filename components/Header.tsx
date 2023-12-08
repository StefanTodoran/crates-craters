import { View, StatusBar, StyleSheet } from "react-native";
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

import PurpleBanner from "../assets/purple_banner.png";
import RedBanner from "../assets/red_banner.png";
import YellowBanner from "../assets/yellow_banner.png";
import GreenBanner from "../assets/green_banner.png";

const pageThemeData = [ // TODO: use colors from Theme.ts to avoid duplication!
  { // Purple
    color: "#BEA9DF",
    banner: PurpleBanner,
  },
  { // Red
    color: "#FA8484",
    banner: RedBanner,
  },
  { // Yellow    
    color: "#f9d385",
    banner: YellowBanner,
  },
  { // Green
    color: "#9BD99D",
    banner: GreenBanner,
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