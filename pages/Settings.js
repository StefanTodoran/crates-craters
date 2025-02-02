import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import MenuButton from "../components/MenuButton";
import SliderBar from "../components/SliderBar";
import SubpageContainer from "../components/SubpageContainer";
import { useOnUnmount } from "../util/hooks";

/**
 * @typedef {object} Props
 * @property {() => void} darkModeCallback
 * @property {() => void} audioModeCallback
 * @property {(sensitivity: number) => void} setSensitivityCallback
 * @property {(delay: number) => void} setTapDelayCallback
 */

/**
 * @param {Props} props
 */
export default function Settings({
  darkModeCallback,
  audioModeCallback,
  // setThemeCallback,
  setSensitivityCallback,
  setTapDelayCallback,
}) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio } = useContext(GlobalContext);

  const [newDragSens, setNewDragSens] = useState(dragSensitivity);
  const [newTapDelay, setNewTapDelay] = useState(doubleTapDelay);

  function updateSettings() {
    // We don't update useContext directly since it is quite slow,
    // instead we batch changes on component unmount.
    setSensitivityCallback(newDragSens);
    setTapDelayCallback(newTapDelay);
  }

  useOnUnmount(updateSettings, [newDragSens, newTapDelay]);

  return (
    <SubpageContainer center>
      <View style={styles.buttonsContainer}>
        <Text style={[TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR), { width: "100%", marginBottom: 0 }]}>
          Settings
        </Text>

        <MenuButton
          onPress={darkModeCallback}
          label="Toggle Dark Mode"
          icon={graphics.NIGHT_MODE_ICON}
          theme={colors.GREEN_THEME}
          fillWidth
        />
        <MenuButton onPress={() => {
          // const newTheme = nextTheme();
          // setThemeCallback(newTheme);
        }}
          label="Change App Theme"
          icon={graphics.THEME_ICON}
          disabled={true}
          theme={colors.GREEN_THEME}
          fillWidth
        />

        <View style={{ height: 15 }} />
        <SliderBar label="Drag Sensitivity" value={newDragSens} units={"%"}
          minValue={10} maxValue={200} changeCallback={setNewDragSens}
          theme={colors.GREEN_THEME}
        />
        <SliderBar label="Double Tap Delay" value={newTapDelay} units={"ms"}
          minValue={100} maxValue={500} changeCallback={setNewTapDelay}
          theme={colors.GREEN_THEME}
        />

        <MenuButton
          onPress={audioModeCallback}
          label="Toggle Sounds"
          icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON}
          theme={colors.GREEN_THEME}
          fillWidth
        />
      </View>
    </SubpageContainer>
  );
}

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: "20%",
    marginBottom: normalize(32),
  },
});