import { useMemo } from "react";
import AboutIcon from "../assets/main_theme/about.png";
import GuideIcon from "../assets/main_theme/help.png";
import SettingsIcon from "../assets/main_theme/settings.png";
import Subpages from "../components/Subpages";
import { colors } from "../Theme";
import About from "./About";
import HowToPlay from "./HowToPlay";
import Settings from "./Settings";

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
    ];
  }, []);

  return (
    <Subpages pageComponents={pageComponents} pageTabs={pageTabs} />
  );
}