import { Image, StyleSheet, Text, View } from "react-native";
import { normalize } from "../TextStyles";
import { colors, purpleTheme } from "../Theme";
import { Tool } from "../util/tools";

interface Props {
  tool: Tool,
}

export default function CurrentToolIndicator({ tool }: Props) {
  const useTheme = tool.theme || purpleTheme;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Current Tool: </Text>
        <Image source={tool.icon} style={styles.icon} />
        <Text style={[styles.toolName, { color: useTheme.MAIN_COLOR }]}>{tool.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: normalize(10),
    marginBottom: normalize(15),
  },
  label: {
    color: colors.DIM_GRAY,
    fontSize: normalize(14),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  toolName: {
    marginLeft: 4,
    fontSize: normalize(18),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    height: normalize(32),
    width: normalize(32),
    marginLeft: normalize(8),
  },
});