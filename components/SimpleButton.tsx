import { useContext } from "react";
import { Text, Image, StyleSheet, ImageSourcePropType, View } from "react-native";

import { Theme, purpleTheme } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";

import ResponsivePressable from "./ResponsivePressable";

interface SVGProps {
  width: number,
  height: number,
  fillColor: string,
}

interface Props {
  text?: string,
  onPress?: () => void,
  onLongPress?: () => void,
  icon?: ImageSourcePropType,
  Svg?: React.FC<SVGProps>,
  disabled?: boolean,
  main?: boolean,
  wide?: boolean,
  theme?: Theme,
  square?: boolean,
  fillWidth?: boolean,
  extraMargin?: boolean,
}

export default function SimpleButton({
  onPress,
  onLongPress,
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
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = theme || purpleTheme;
  
  const hasIcon: boolean = !!icon || !!Svg;
  const buttonColor = darkMode ? useTheme.DARK_COLOR : useTheme.MAIN_COLOR;

  let backgroundColor = darkMode ? "#000" : "#fff";
  if (main) backgroundColor = buttonColor;

  let paddingHorizontal = hasIcon ? normalize(10) : normalize(25);
  if (wide) paddingHorizontal = normalize(50);

  let paddingVertical = square ? paddingHorizontal : normalize(5);
  if (!!onLongPress) paddingVertical = normalize(10);

  return (
    <ResponsivePressable
      onPress={onPress}
      onLongPress={onLongPress}
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
        extraMargin ? staticStyles.extraMargin : {},
      ]}
      pressedStyle={{
        opacity: 0.75,
      }}
    >
      {icon && <Image style={staticStyles.bigIcon} source={icon} />}
      {!!Svg && <Svg width={staticStyles.bigIcon.width} height={staticStyles.bigIcon.height} fillColor={useTheme.MAIN_COLOR} />}

      {text && <View>
        <Label
          text={text}
          darkMode={darkMode}
          hasIcon={hasIcon}
          theme={useTheme}
          main={main}
        />

        {onLongPress && <Label
          text={"(Long Press)"}
          darkMode={darkMode}
          hasIcon={hasIcon}
          theme={useTheme}
          main={main}
        />}
      </View>}
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
  extraMargin: {
    marginVertical: normalize(6),
    marginHorizontal: normalize(6),
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