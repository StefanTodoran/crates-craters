import { useContext, useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
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
}

export default function Settings({
  darkModeCallback,
  audioModeCallback,
  hapticsCallback,
  setSensitivityCallback,
  setTapDelayCallback,
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

  return (
    <SubpageContainer center>
      <View style={styles.buttonsContainer}>
        <Text style={[TextStyles.subtitle(darkMode, colors.GREEN_THEME.MAIN_COLOR), { width: "100%", marginBottom: 0 }]}>
          Settings
        </Text>

        <SettingSwitch label="Dark Mode" value={darkMode} onToggle={darkModeCallback} />
        <SettingSwitch label="Sounds" value={playAudio} onToggle={audioModeCallback} />
        <SettingSwitch label="Haptics" value={haptics} onToggle={hapticsCallback} />

        <MenuButton
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
      </View>
    </SubpageContainer>
  );
}

/** A labelled system switch (UISwitch on iOS, Material switch on Android). */
function SettingSwitch({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) {
  const { darkMode } = useContext(GlobalContext);
  return (
    <View style={styles.switchRow}>
      <Text allowFontScaling={false} style={[styles.switchLabel, { color: darkMode ? colors.OFF_WHITE : colors.DIM_GRAY }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.GREEN_THEME.MAIN_COLOR }}
        thumbColor={Platform.OS === "android" && value ? colors.GREEN_THEME.DARK_COLOR : undefined}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: normalize(8),
  },
  switchLabel: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(16),
  },
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: "20%",
    marginBottom: normalize(32),
  },
});