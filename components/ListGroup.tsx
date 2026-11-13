import { ReactNode, useContext } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";

/** A rounded container of rows, like an iOS inset grouped list. */
export function ListGroup({ children }: { children: ReactNode }) {
  const { darkMode } = useContext(GlobalContext);
  return (
    <View style={[styles.group, {
      backgroundColor: darkMode ? colors.OFF_WHITE_TRANSPARENT(0.06) : colors.NEAR_BLACK_TRANSPARENT(0.03),
    }]}>
      {children}
    </View>
  );
}

interface RowProps {
  title: string,
  last?: boolean, // The last row has no separator below it.
  destructive?: boolean,
  onPress?: () => void, // Pressable rows show a chevron (unless destructive).
  accessory?: ReactNode, // Shown on the right instead of the chevron.
}

export function ListRow({ title, last, destructive, onPress, accessory }: RowProps) {
  const { darkMode } = useContext(GlobalContext);
  const textColor = destructive ? colors.RED_THEME.TINT_COLOR : (darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        styles.row,
        !last && styles.separator,
        pressed && { backgroundColor: colors.DIM_GRAY_TRANSPARENT(0.12) },
      ]}
    >
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      {accessory ?? (onPress && !destructive && <Text style={styles.chevron}>›</Text>)}
    </Pressable>
  );
}

/** A row with a system switch, tinted with the given color. */
export function SwitchRow({ title, value, onToggle, color, last }: { title: string, value: boolean, onToggle: () => void, color: string, last?: boolean }) {
  return (
    <ListRow
      title={title}
      last={last}
      accessory={<Switch value={value} onValueChange={onToggle} trackColor={{ true: color }} accessibilityLabel={title} />}
    />
  );
}

const styles = StyleSheet.create({
  group: {
    width: "100%",
    borderRadius: normalize(14),
    overflow: "hidden",
    marginBottom: normalize(16),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: normalize(48),
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.DIM_GRAY_TRANSPARENT(0.25),
  },
  title: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(16),
  },
  chevron: {
    fontSize: normalize(22),
    color: colors.DIM_GRAY_TRANSPARENT(0.6),
    marginTop: -normalize(2),
  },
});
