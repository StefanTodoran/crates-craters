import { useContext } from "react";
import { Platform, PlatformColor, StyleSheet, TextInput, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";

interface Props {
  value: string,
  onChange: (text: string) => void,
  placeholder?: string,
}

const ios = Platform.OS === "ios";

/**
 * A search field styled like the system one: the iOS search bar's filled capsule
 * (system fill and label colors, built-in clear button) or a Material search field.
 */
export default function SearchField({ value, onChange, placeholder = "Search" }: Props) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <View style={[
      styles.field,
      ios ?
        { backgroundColor: PlatformColor("tertiarySystemFill") } :
        { backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.1) : colors.NEAR_BLACK_TRANSPARENT(0.06), borderRadius: 28 },
    ]}>
      <Svg width={normalize(17)} height={normalize(17)} viewBox="0 0 24 24" style={styles.icon}>
        <Circle cx={10} cy={10} r={7} stroke={colors.DIM_GRAY} strokeWidth={2.5} fill="none" />
        <Line x1={15.5} y1={15.5} x2={21.5} y2={21.5} stroke={colors.DIM_GRAY} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
      <TextInput
        style={[styles.input, ios ? { color: PlatformColor("label") } : { color: darkMode ? colors.OFF_WHITE : colors.NEAR_BLACK }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={ios ? PlatformColor("placeholderText") : colors.DIM_GRAY}
        clearButtonMode="while-editing"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        enablesReturnKeyAutomatically
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: normalize(40),
    borderRadius: 12,
    paddingHorizontal: normalize(10),
  },
  icon: {
    marginRight: normalize(6),
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: normalize(17),
    paddingVertical: 0,
  },
});
