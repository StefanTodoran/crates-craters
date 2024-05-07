import { useContext } from "react";
import { Text } from "react-native";

import { colors } from "../Theme";
import TextStyles from "../TextStyles";
import GlobalContext from "../GlobalContext";

interface Props {
    //
}

export default function ProfilePage({ }: Props) {
    const { darkMode } = useContext(GlobalContext);
    
    return (
        <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR }]}>
            Under Construction
        </Text>
    );
}