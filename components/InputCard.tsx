import { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../Theme";

import InputLine from "./InputLine";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";

interface InputField {
  label: string,
  value: string,
  update: (value: string) => void,
}

interface Props {
  title: string,
  hints?: string[],
  fields?: InputField[],
}

export default function InputCard({
  title,
  hints,
  fields,
}: Props) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <>
      <Text style={[
        TextStyles.subtitle(darkMode, colors.DIM_GRAY),
        { textAlign: "center" },
      ]}>{title}</Text>

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
    </>
  );
}

const styles = StyleSheet.create({
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
  inputContainer: {
    position: "relative",
    marginBottom: 10,
    borderColor: colors.DIM_GRAY,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: normalize(15),
    // paddingBottom: normalize(15),
  },
});