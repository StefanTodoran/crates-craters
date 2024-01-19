import { Text, View } from "react-native";
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
import TextStyles from "../TextStyles";

interface Props {
  darkModeCallback: () => void,
  audioModeCallback: () => void,
  setSensitivityCallback: (sensitivity: number) => void,
  setTapDelayCallback: (delay: number) => void,
}

export default function AccountSettings({
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
        setSensitivityCallback={setSensitivityCallback}
        setTapDelayCallback={setTapDelayCallback}
      />,
      <About />,
      <View>
        <Text style={[TextStyles.subtitle(false), { color: colors.GREEN_THEME.MAIN_COLOR }]}>
          Coming Soon
        </Text>
      </View>,
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
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs} />
  );
}