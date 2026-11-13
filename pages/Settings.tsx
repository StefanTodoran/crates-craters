import { useContext, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import GlobalContext, { defaultSettings } from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { ListGroup, ListRow, SwitchRow } from "../components/ListGroup";
import MenuButton from "../components/MenuButton";
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
      <View style={[styles.buttonsContainer, { paddingHorizontal: ios ? "10%" : "20%" }]}>
        <Text style={[TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR), { width: "100%", marginBottom: 0 }]}>
          Settings
        </Text>

        {/* iOS: system switches in a grouped list. Android: the app's own toggle buttons. */}
        {ios ? <>
          <View style={{ height: normalize(12) }} />
          <ListGroup>
            <SwitchRow title="Dark Mode" icon={graphics.NIGHT_MODE_ICON} value={darkMode} onToggle={darkModeCallback} color={colors.GREEN_THEME.MAIN_COLOR} />
            <SwitchRow title="Sounds" icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON} value={playAudio} onToggle={audioModeCallback} color={colors.GREEN_THEME.MAIN_COLOR} />
            <SwitchRow title="Haptics" icon={graphics.HAPTICS_ICON} value={haptics} onToggle={hapticsCallback} color={colors.GREEN_THEME.MAIN_COLOR} last />
          </ListGroup>
        </> : <>
          <MenuButton
            onPress={darkModeCallback}
            label="Toggle Dark Mode"
            icon={graphics.NIGHT_MODE_ICON}
            theme={colors.GREEN_THEME}
            fillWidth
          />
          <MenuButton
            onPress={audioModeCallback}
            label="Toggle Sounds"
            icon={playAudio ? graphics.AUDIO_ON_ICON : graphics.AUDIO_OFF_ICON}
            theme={colors.GREEN_THEME}
            fillWidth
          />
          <MenuButton
            onPress={hapticsCallback}
            label="Toggle Haptics"
            icon={graphics.HAPTICS_ICON}
            theme={colors.GREEN_THEME}
            fillWidth
          />
        </>}

        <View style={{ height: 15 }} />
        <SliderBar label="Drag Sensitivity" value={newDragSens} units={"%"}
          minValue={10} maxValue={200} changeCallback={setNewDragSens}
          theme={colors.GREEN_THEME}
        />
        <SliderBar label="Double Tap Delay" value={newTapDelay} units={"ms"}
          minValue={100} maxValue={500} changeCallback={setNewTapDelay}
          theme={colors.GREEN_THEME}
        />

        <View style={{ height: normalize(20) }} />
        {ios ?
          <ListGroup>
            <ListRow title="Reset Settings" icon={graphics.RESET_ICON} onPress={confirmReset} last />
          </ListGroup> :
          <MenuButton
            onPress={confirmReset}
            label="Reset Settings"
            icon={graphics.RESET_ICON}
            theme={colors.GREEN_THEME}
            fillWidth
          />
        }
      </View>
    </SubpageContainer>
  );
}

const ios = Platform.OS === "ios";

const styles = StyleSheet.create({
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: normalize(32),
  },
});