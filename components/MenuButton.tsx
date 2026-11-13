import { useContext } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { Theme, purpleTheme } from "../Theme";
import ResponsivePressable from "./ResponsivePressable";

interface Props {
  label?: string, // The text to be displayed in the button.
  onPress?: () => void, // The function to be called on press event.
  onLongPress?: () => void, // The function to be called on long press event.
  icon?: ImageSourcePropType, // The image to be displayed in the button.
  iconRotation?: number, // The rotation of the icon in degrees.
  disabled?: boolean, // Whether or not the button can be pressed (changes appearance).
  allowOverflow?: boolean, // Whether number of lines for the button text should cap at 1.
  theme?: Theme,
  fillWidth?: boolean,
  selected?: boolean, // Highlighted, e.g. the editor's current tool.
}

/**
 * MenuButton is the basic button type used throughout the project.
 * It has a few simple props.
 * 
 * @params borderColor, backgroundColor, darkModeBackgroundColor, pressedColor, textColor
 * Overrides for the various aspects of the button coloring.
 */
export default function MenuButton({
  onPress,
  onLongPress,
  label,
  icon,
  iconRotation,
  disabled,
  allowOverflow,
  theme,
  fillWidth,
  selected,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = theme || purpleTheme;
  // const backgroundColor = darkMode ? useTheme.MAIN_TRANSPARENT(0.1) : useTheme.OFF_WHITE;
  const backgroundColor = darkMode ? useTheme.NEAR_BLACK : useTheme.OFF_WHITE;

  return (
    <ResponsivePressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      customStyle={[
        styles.body,
        {
          width: fillWidth ? "100%" : undefined,
          marginHorizontal: normalize(7.5),
          paddingRight: label ? normalize(17.5) : normalize(15),
          borderColor: useTheme.MAIN_COLOR,
          backgroundColor: selected ? useTheme.MAIN_TRANSPARENT(darkMode ? 0.35 : 0.3) : backgroundColor,
          borderWidth: selected ? 2 : 1,
        }
      ]}
      pressedStyle={{
        backgroundColor: useTheme.MAIN_TRANSPARENT(0.3),
      }}
    >
      {(icon) && <Image style={[styles.icon, { transform: [{ rotate: `${iconRotation ?? 0}deg` }] }]} source={icon} />}

      {!!label && <Text
        numberOfLines={allowOverflow ? undefined : 1}
        allowFontScaling={false}
        style={[
          styles.label,
          { color: useTheme.MIDDLE_COLOR }
        ]}>{label}</Text>
      }
    </ResponsivePressable>
  );
}

const styles = StyleSheet.create({
  body: {
    borderWidth: 1,
    borderRadius: normalize(10),
    paddingLeft: normalize(15),
    paddingVertical: normalize(14),
    marginTop: normalize(15),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    textAlign: "center",
    fontSize: normalize(16),
    marginLeft: normalize(16),
    // textTransform: "uppercase",
    fontFamily: "Montserrat-Medium",
    letterSpacing: 0.25,
    fontWeight: "bold",
  },
  icon: {
    height: normalize(30),
    width: normalize(30),
  },
});