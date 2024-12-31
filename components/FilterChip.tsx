import { useContext } from "react";
import { StyleSheet, Text } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { Theme, purpleTheme } from "../Theme";
import ResponsivePressable from "./ResponsivePressable";

interface Props {
    text: string,
    active: boolean,
    onPress: () => void,
    disabled?: boolean,
    verticalMargin?: boolean,
    theme?: Theme,
}

export default function FilterChip({
    text,
    active,
    onPress,
    disabled,
    theme,
    verticalMargin,
}: Props) {
    const { darkMode } = useContext(GlobalContext);
    const useTheme = theme || purpleTheme;
    const buttonColor = darkMode ? useTheme.DARK_COLOR : useTheme.MAIN_COLOR;
    const borderColor = darkMode ? useTheme.MAIN_COLOR : useTheme.DARK_COLOR;
    const bgColor = darkMode ? useTheme.NEAR_BLACK : useTheme.OFF_WHITE;

    return (
        <ResponsivePressable
            onPress={onPress}
            disabled={disabled}
            customStyle={[
                styles.container,
                {
                    borderColor: borderColor,
                    backgroundColor: active ? buttonColor : bgColor,
                    marginVertical: verticalMargin ? normalize(6) : 0,
                },
            ]}
        >
            <Text
                allowFontScaling={false}
                style={[
                    styles.text,
                    {
                        color: active ? "#fff" : buttonColor,
                    },
                ]}>
                {text}
            </Text>
        </ResponsivePressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: normalize(6),
        // paddingTop: normalize(6),
        // paddingBottom: normalize(10),
        paddingVertical: normalize(8),
        paddingHorizontal: normalize(8),
        borderRadius: 24,
        borderWidth: 1,
    },
    text: {
        fontFamily: "Montserrat-Regular",
        fontWeight: "normal",
        fontSize: normalize(16),
        // textAlignVertical: "center",
    },
});