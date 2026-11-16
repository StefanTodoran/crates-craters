import { useContext, useState } from "react";
import { Alert, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import GlobalContext, { defaultSettings } from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { ListGroup, ListRow, SwitchRow } from "../components/ListGroup";
import SliderBar from "../components/SliderBar";
import SubpageContainer from "../components/SubpageContainer";
import { useOnUnmount } from "../util/hooks";

interface Props {
  darkModeCallback: () => void,
  audioModeCallback: () => void,
  hapticsCallback: () => void,
  setSensitivityCallback: (sensitivity: number) => void,
  setTapDelayCallback: (delay: number) => void,
  resetSettingsCallback: () => void,
}

export default function Settings({
  darkModeCallback,
  audioModeCallback,
  hapticsCallback,
  setSensitivityCallback,
  setTapDelayCallback,
  resetSettingsCallback,
}: Props) {
  const { darkMode, dragSensitivity, doubleTapDelay, playAudio, haptics } = useContext(GlobalContext);

  const [newDragSens, setNewDragSens] = useState(dragSensitivity);
  const [newTapDelay, setNewTapDelay] = useState(doubleTapDelay);

  function updateSettings() {
    // We don't update useContext directly since it is quite slow,
    // instead we batch changes on component unmount.
    setSensitivityCallback(newDragSens);
    setTapDelayCallback(newTapDelay);
  }

  useOnUnmount(updateSettings, [newDragSens, newTapDelay]);

  // The sliders span their row: the page's 5% side padding and the row's own padding.
  const win = useWindowDimensions();
  const sliderWidth = win.width * 0.9 - 2 * normalize(16);
  const textColor = darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR;

  function confirmReset() {
    Alert.alert("Reset settings?", "Dark mode, sounds, haptics, drag sensitivity and double tap delay go back to their defaults.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive", onPress: () => {
          // The sliders hold their values locally until unmount, so reset those too.
          setNewDragSens(defaultSettings.dragSensitivity);
          setNewTapDelay(defaultSettings.doubleTapDelay);
          resetSettingsCallback();
        },
      },
    ], { cancelable: true, userInterfaceStyle: darkMode ? "dark" : "light" });
  }

  return (
    <SubpageContainer center>
      <View style={styles.container}>
        <Text style={styles.sectionLabel}>Sound & Appearance</Text>
        <ListGroup>
          <SwitchRow title="Dark Mode" icon={graphics.NIGHT_MODE_ICON} value={darkMode} onToggle={darkModeCallback} color={colors.GREEN_THEME.MAIN_COLOR} />
          <SwitchRow title="Sounds" icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON} value={playAudio} onToggle={audioModeCallback} color={colors.GREEN_THEME.MAIN_COLOR} />
          <SwitchRow title="Haptics" icon={graphics.HAPTICS_ICON} value={haptics} onToggle={hapticsCallback} color={colors.GREEN_THEME.MAIN_COLOR} last />
        </ListGroup>

        <Text style={styles.sectionLabel}>Gameplay Controls</Text>
        <ListGroup>
          <View style={[styles.sliderRow, styles.separator]}>
            <SliderBar label="Drag Sensitivity" value={newDragSens} units={"%"}
              minValue={10} maxValue={200} changeCallback={setNewDragSens}
              theme={colors.GREEN_THEME}
              width={sliderWidth}
              labelColor={textColor}
            />
          </View>
          <View style={styles.sliderRow}>
            <SliderBar label="Double Tap Delay" value={newTapDelay} units={"ms"}
              minValue={100} maxValue={500} changeCallback={setNewTapDelay}
              theme={colors.GREEN_THEME}
              width={sliderWidth}
              labelColor={textColor}
            />
          </View>
        </ListGroup>

        <View style={{ height: normalize(8) }} />
        <ListGroup>
          <ListRow title="Reset Settings" icon={graphics.DELETE_ICON} onPress={confirmReset} destructive last />
        </ListGroup>
      </View>
    </SubpageContainer>
  );
}


const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: normalize(16),
  },
  sectionLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: normalize(12),
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.DIM_GRAY,
    marginLeft: normalize(16),
    marginBottom: normalize(8),
  },
  sliderRow: {
    alignItems: "center",
    paddingVertical: normalize(10),
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.DIM_GRAY_TRANSPARENT(0.25),
  },
});
