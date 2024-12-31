import { useContext } from "react";
import { Alert, Image, ImageSourcePropType, StyleSheet, Text } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { Theme, purpleTheme } from "../Theme";
import ResponsivePressable from "./ResponsivePressable";

interface SVGProps {
  width: number,
  height: number,
  fillColor: string,
}

interface Props {
  text?: string,
  onPress?: () => void,
  icon?: ImageSourcePropType,
  Svg?: React.FC<SVGProps>,
  disabled?: boolean,
  main?: boolean,
  wide?: boolean,
  theme?: Theme,
  square?: boolean,
  fillWidth?: boolean,
  extraMargin?: number | number[],
  doConfirmation?: string,
}

export default function SimpleButton({
  onPress,
  text,
  icon,
  Svg,
  disabled,
  main,
  wide,
  theme,
  square,
  fillWidth,
  extraMargin,
  doConfirmation,
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = theme || purpleTheme;

  const hasIcon: boolean = !!icon || !!Svg;
  const buttonColor = darkMode ? useTheme.DARK_COLOR : useTheme.MAIN_COLOR;

  let backgroundColor = darkMode ? "#000" : "#fff";
  if (main) backgroundColor = buttonColor;

  let paddingHorizontal = hasIcon ? normalize(10) : normalize(25);
  if (wide) paddingHorizontal = normalize(50);

  const paddingVertical = square ? paddingHorizontal : normalize(5);

  let marginArray;
  if (extraMargin) {
    if (typeof extraMargin === "number") {
      marginArray = [extraMargin, extraMargin, extraMargin, extraMargin];
    } else {
      if (extraMargin.length === 2) {
        marginArray = [extraMargin[0], extraMargin[0], extraMargin[1], extraMargin[1]];
      }
      else if (extraMargin.length === 4) {
        marginArray = extraMargin;
      } else {
        throw new Error("Invalid extraMargin value, should be a number, or an array of 2 or 4 numbers.");
      }
    }
  }

  // [left, right, top, bottom]
  const marginLeft = marginArray && marginArray[0];
  const marginRight = marginArray && marginArray[1];
  const marginTop = marginArray && marginArray[2];
  const marginBottom = marginArray && marginArray[3];

  function handleOnPress() {
    if (doConfirmation) {
      Alert.alert("Confirm Action", doConfirmation, [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: onPress },
      ], { cancelable: true, userInterfaceStyle: darkMode ? "dark" : "light" });
    } else {
      onPress?.();
    }
  }

  return (
    <ResponsivePressable
      onPress={handleOnPress}
      disabled={disabled}
      customStyle={[
        staticStyles.simpleButton,
        {
          borderColor: buttonColor,
          backgroundColor: backgroundColor,
          paddingHorizontal: paddingHorizontal,
          paddingVertical: paddingVertical,
        },
        fillWidth ? staticStyles.fillWidth : {},
        extraMargin ? {
          marginTop: normalize(marginTop!),
          marginRight: normalize(marginRight!),
          marginBottom: normalize(marginBottom!),
          marginLeft: normalize(marginLeft!),
        } : {},
      ]}
      pressedStyle={{
        opacity: 0.75,
      }}
    >
      {icon && <Image style={staticStyles.bigIcon} source={icon} />}
      {!!Svg && <Svg width={staticStyles.bigIcon.width} height={staticStyles.bigIcon.height} fillColor={useTheme.MAIN_COLOR} />}

      {text && <Label
        text={text}
        darkMode={darkMode}
        hasIcon={hasIcon}
        theme={useTheme}
        main={main}
      />}
    </ResponsivePressable>
  );
}

interface LabelProps {
  text: string,
  darkMode: boolean,
  hasIcon: boolean,
  main?: boolean,
  theme: Theme,
}

function Label({ text, darkMode, hasIcon, main, theme }: LabelProps) {
  return (
    <>
      <Text
        allowFontScaling={false}
        style={[
          TextStyles.paragraph(darkMode),
          dynamicStyles.label(hasIcon, theme, main),
        ]}>
        {text}
      </Text>
    </>
  );
}

const staticStyles = StyleSheet.create({
  simpleButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: normalize(5),
    borderRadius: normalize(10),
    borderWidth: 1,
    // TODO: Maybe optionally allow flex here? For when there is only a single
    // button in a level card, since it looks somewhat empty.
    // flex: 1,
  },
  bigIcon: {
    height: normalize(30),
    width: normalize(30),
  },
  fillWidth: {
    justifyContent: "space-between",
    width: "100%",
  },
});

const dynamicStyles = StyleSheet.create<any>({
  label: (hasIcon: boolean, theme: Theme, main?: boolean) => ({
    marginBottom: 0,
    marginHorizontal: hasIcon ? normalize(8) : 0,
    color: main ? "#fff" : theme.MAIN_COLOR,
    fontSize: normalize(15),
    textAlign: "right",
  }),
});