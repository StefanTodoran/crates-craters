import { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Theme, colors } from "../Theme";

import InputLine from "./InputLine";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import SimpleButton from "./SimpleButton";

interface InputField {
  label: string,
  value: string,
  update: (value: string) => void,
}

interface PropsBase {
  title: string,
  hints?: string[],
  fields?: InputField[],
}

interface PropsWithoutButton extends PropsBase {
  buttonText?: never,
  buttonCallback?: never,
  buttonDisabled?: never,
}

interface PropsWithButton extends PropsBase {
  buttonText: string,
  buttonCallback: () => void,
  buttonDisabled?: boolean,
}

type Props = PropsWithoutButton | PropsWithButton;

// We force this incomplete theme to be of type Theme since SimpleButton only uses MAIN_COLOR.
const lightModeGrayTheme: Theme = { MAIN_COLOR: "#8A858D" } as Theme;
const darkModeGrayTheme: Theme = { MAIN_COLOR: "#d7d0db" } as Theme;

export default function InputCard({
  title,
  hints,
  fields,
  buttonText,
  buttonCallback,
  buttonDisabled,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={[
          TextStyles.subtitle(darkMode, "#fff"),
          { marginTop: normalize(10), marginBottom: normalize(10) },
        ]}>{title}</Text>

        {buttonText && <SimpleButton
          text={buttonText}
          theme={darkMode ? darkModeGrayTheme : lightModeGrayTheme}
          onPress={buttonCallback}
          disabled={buttonDisabled}
        />}
      </View>

      <View style={styles.inputContainer}>
        {fields?.map((field, idx) =>
          <InputLine
            key={idx}
            label={field.label}
            value={field.value}
            onChange={field.update}
            darkMode={darkMode}
          />
        )}

        {hints && <View style={styles.hintsContainer}>
          {hints.map((hint, idx) => <Text key={idx} style={styles.hint}>{hint}</Text>)}
        </View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.DIM_GRAY,
    borderWidth: 1,
    borderRadius: normalize(10),
    overflow: "hidden",
    marginVertical: normalize(15),
    // marginBottom: normalize(15),
  },
  hintsContainer: {
    marginTop: 5,
    marginBottom: 15,
  },
  hint: {
    color: colors.DIM_GRAY_TRANSPARENT(0.5),
    fontSize: normalize(14),
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  },
  titleContainer: {
    backgroundColor: colors.DIM_GRAY,
    borderBottomColor: colors.DIM_GRAY,
    borderBottomWidth: 1,
    paddingLeft: normalize(15),
    paddingRight: normalize(10),
    paddingVertical: normalize(5),
    flexDirection: "row",
    justifyContent: "space-between"
  },
  inputContainer: {
    paddingHorizontal: normalize(15),
    // position: "relative",
    // paddingBottom: normalize(15),
  },
});