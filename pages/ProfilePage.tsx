import { UserCredential, signOut } from "firebase/auth";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { auth } from "../util/firebase";
import { metadataKeys, setData } from "../util/loader";
import LoginPage from "./LoginPage";

interface Props {
    setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function ProfilePage({ setUserCredential }: Props) {
    const { darkMode, userCredential } = useContext(GlobalContext);

    if (!userCredential) return <LoginPage setUserCredential={setUserCredential} />;
    return (
        <SubpageContainer center>
            <Text style={[TextStyles.subtitle(darkMode), { color: colors.YELLOW_THEME.MAIN_COLOR, textAlign: "center" }]}>
                Under Construction
            </Text>

            <Text style={[TextStyles.paragraph(darkMode), { textAlign: "center" }]}>
                {userCredential?.user.email}
            </Text>
            <Text style={[TextStyles.paragraph(darkMode), { textAlign: "center" }]}>
                Email verified? {!!userCredential?.user.emailVerified ? "true" : "false"}
            </Text>
            <Text style={[TextStyles.paragraph(darkMode), { textAlign: "center" }]}>
                UID: {userCredential?.user.uid}
            </Text>
            <Text style={[TextStyles.paragraph(darkMode), { textAlign: "center" }]}>
                For Support: info@todoran.dev
            </Text>

            <View style={styles.buttonsRow}>
                <SimpleButton
                    text="Sign Out"
                    icon={graphics.SIGNUP_ICON}
                    theme={colors.YELLOW_THEME}
                    onPress={() => {
                        signOut(auth)
                            .then(() => {
                                setUserCredential(undefined);
                                setData(metadataKeys.userCredentials, null);
                                
                                Toast.show({
                                    type: "success",
                                    text1: "Account logout succeeded!",
                                    text2: "You are no longer logged in.",
                                });
                            })
                            .catch((error) => {
                                Toast.show({
                                    type: "error",
                                    text1: "Account logout failed.",
                                    text2: `Error code: ${error.code}. Please try again.`,
                                });
                            });
                    }}
                    main
                />
            </View>
        </SubpageContainer>
    );
}

const styles = StyleSheet.create({
    buttonsRow: {
        flexDirection: "row",
        justifyContent: "center",
    },
    hintRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: normalize(10),
    },
});