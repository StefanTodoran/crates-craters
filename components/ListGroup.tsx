import { ReactNode, useContext } from "react";
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
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
  icon?: ImageSourcePropType, // Shown before the title.
  subtitle?: string, // A smaller line under the title, e.g. why the row is disabled.
  disabled?: boolean,
}

export function ListRow({ title, last, destructive, onPress, accessory, icon, subtitle, disabled }: RowProps) {
  const { darkMode } = useContext(GlobalContext);
  const textColor = destructive ? colors.RED_THEME.TINT_COLOR : (darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [
        styles.row,
        !last && styles.separator,
        disabled && { opacity: 0.45 },
        pressed && { backgroundColor: colors.DIM_GRAY_TRANSPARENT(0.12) },
      ]}
    >
      <View style={styles.leading}>
        {icon && <Image source={icon} style={styles.icon} />}
        <View style={styles.titles}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {accessory ?? (onPress && !destructive && <Text style={styles.chevron}>›</Text>)}
    </Pressable>
  );
}

/** A row with a system switch, tinted with the given color. */
export function SwitchRow({ title, value, onToggle, color, last, icon }: { title: string, value: boolean, onToggle: () => void, color: string, last?: boolean, icon?: ImageSourcePropType }) {
  return (
    <ListRow
      title={title}
      icon={icon}
      last={last}
      accessory={<Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: color }}
        // Android tints the thumb with the system accent (teal) by default; white matches iOS.
        thumbColor={Platform.OS === "android" ? "#fff" : undefined}
        accessibilityLabel={title}
      />}
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
  leading: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(12),
  },
  icon: {
    width: normalize(26),
    height: normalize(26),
  },
  titles: {
    flex: 1,
  },
  title: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(16),
  },
  subtitle: {
    fontFamily: "Montserrat-Regular",
    fontSize: normalize(12),
    color: colors.DIM_GRAY,
    marginTop: normalize(2),
  },
  chevron: {
    fontSize: normalize(22),
    color: colors.DIM_GRAY_TRANSPARENT(0.6),
    marginTop: -normalize(2),
  },
});
