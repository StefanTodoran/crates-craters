import { useContext } from "react";
import { Text, Image, StyleSheet, ImageSourcePropType } from "react-native";

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
  icon?: ImageSourcePropType,
  Svg?: React.FC<SVGProps>,
  disabled?: boolean,
  main?: boolean,
  wide?: boolean,
  theme?: Theme,
  square?: boolean,
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
}: Props) {
  const { darkMode } = useContext(GlobalContext);
  const useTheme = theme || purpleTheme;

  let backgroundColor = darkMode ? "#000" : "#fff";
  if (main) backgroundColor = useTheme.MAIN_COLOR;
  
  let paddingHorizontal = (icon || Svg) ? normalize(10) : normalize(25);
  if (wide) paddingHorizontal = normalize(50);

  return (
    <ResponsivePressable
      onPress={onPress}
      disabled={disabled}
      customStyle={[
        styles.simpleButton,
        {
          borderColor: useTheme.MAIN_COLOR,
          backgroundColor: backgroundColor,
          paddingHorizontal: paddingHorizontal,
          paddingVertical: square ? paddingHorizontal : normalize(5),
        },
      ]}
      pressedStyle={{
        opacity: 0.75,
      }}
    >
      {icon && <Image style={styles.bigIcon} source={icon} />}
      {!!Svg && <Svg width={styles.bigIcon.width} height={styles.bigIcon.height} fillColor={useTheme.MAIN_COLOR} />}

      {text && <Text
        allowFontScaling={false}
        style={[
          TextStyles.paragraph(darkMode),
          {
            marginBottom: 0,
            marginHorizontal: (icon || Svg) ? normalize(10) : 0,
            color: main ? "#fff" : useTheme.MAIN_COLOR,
            fontSize: normalize(15),
          }
        ]}>{text}</Text>}
    </ResponsivePressable>
  );
}

const styles = StyleSheet.create({
  simpleButton: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: normalize(5),
    borderRadius: normalize(10),
    borderWidth: 1,
  },
  bigIcon: {
    height: normalize(30),
    width: normalize(30),
  },
});