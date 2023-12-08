import { Text } from "react-native";
import TextStyles from "../TextStyles";
import { colors } from "../Theme";
import { useContext } from "react";
import GlobalContext from "../GlobalContext";

interface Props {

}

export default function ({ }: Props) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <>
      <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
        Coming Soon
      </Text>
    </>
  );
}