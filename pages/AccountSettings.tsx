import { Text } from "react-native";
import React, { useMemo } from "react";
import { colors } from "../Theme";

import About from "./About";
import Settings from "./Settings";
import HowToPlay from "./HowToPlay";

import GuideIcon from "../assets/main_theme/help.png";
import SettingsIcon from "../assets/main_theme/settings.png";
import AboutIcon from "../assets/main_theme/about.png";
import ProfileIcon from "../assets/main_theme/profile.png";
import Subpages from "../components/Subpages";

interface Props {
  darkModeCallback: (darkMode: boolean) => void,
  audioModeCallback: (playAudio: boolean) => void,
  setSensitivityCallback: (sensitivity: number) => void,
  setTapDelayCallback: (delay: number) => void,
}

export default function HomePage({
  darkModeCallback,
  audioModeCallback,
  setSensitivityCallback,
  setTapDelayCallback,
}: Props) {
  const pageComponents = useMemo(() => {
    return [
      <HowToPlay />,
      <Settings
        darkModeCallback={darkModeCallback}
        audioModeCallback={audioModeCallback}
        setThemeCallback={() => { }}
        setSensitivityCallback={setSensitivityCallback}
        setTapDelayCallback={setTapDelayCallback}
      />,
      <About />,
      <Text>Profile Page (TODO)</Text>,
    ];
  }, []);

  const pageTabs = useMemo(() => {
    return [
      {
        label: "Guide",
        color: colors.GREEN_THEME.MAIN_COLOR,
        icon: GuideIcon,
      },
      {
        label: "Settings",
        color: colors.GREEN_THEME.MAIN_COLOR,
        icon: SettingsIcon,
      },
      {
        label: "About",
        color: colors.GREEN_THEME.MAIN_COLOR,
        icon: AboutIcon,
      },
      {
        label: "Profile",
        color: colors.GREEN_THEME.MAIN_COLOR,
        icon: ProfileIcon,
      },
    ];
  }, []);

  return (
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs}/>
  );
}