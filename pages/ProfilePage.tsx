import { UserCredential, sendEmailVerification, signOut } from "firebase/auth";
import { useContext } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import InputCard from "../components/InputCard";
import MenuButton from "../components/MenuButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { auth } from "../util/firebase";
import { metadataKeys, setData } from "../util/loader";
import LoginPage from "./LoginPage";

interface Props {
    attemptSignIn: () => Promise<void>,
    setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function ProfilePage({ attemptSignIn, setUserCredential }: Props) {
    const { userData, userCredential } = useContext(GlobalContext);
    const refreshCredentials = (onFinish: () => void) => {
        attemptSignIn().then(onFinish);
    }

    if (!userCredential) return <LoginPage setUserCredential={setUserCredential} />;
    return (
        <SubpageContainer onRefresh={refreshCredentials} center>
            <InputCard
                title={"Profile"}
                hints={[
                    `UID: ${userCredential?.user.uid}`,
                    userCredential?.user.emailVerified ? "Email verified" : "Unverified email",
                ]}
                fields={[
                    {
                        label: "Username",
                        value: userData?.user_name ?? "Loading...",
                        disabled: true,
                    },
                    {
                        label: "Email",
                        value: userCredential.user.email!,
                        disabled: true,
                    },
                ]}
                buttonText="Sign Out"
                buttonCallback={() => {
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
            />

            <View style={styles.buttonsRow}>
                <MenuButton onPress={() => {
                    const user = userCredential.user;
                    sendEmailVerification(user)
                        .then(() => {
                            Toast.show({
                                type: "success",
                                text1: "Email verification sent!",
                                text2: `Please verify your email at ${user.email}.`,
                            });
                        })
                        .catch((error) => {
                            Toast.show({
                                type: "error",
                                text1: "Send verification failed.",
                                text2: `Unable to send verification email. Error code: ${error.code}.`,
                            });
                        });
                }}
                    label="Resend Verification"
                    icon={graphics.MAIL_ICON}
                    theme={colors.YELLOW_THEME}
                    disabled={userCredential.user.emailVerified}
                />
                <MenuButton onPress={() => Linking.openURL("mailto:info@todoran.dev?subject=Crates%20%26%20Craters")}
                    label="Contact Support"
                    icon={graphics.GET_SUPPORT_ICON}
                    theme={colors.YELLOW_THEME}
                />
            </View>

        </SubpageContainer>
    );
}

const styles = StyleSheet.create({
    buttonsRow: {
        // alignItems: "center",
        justifyContent: "center",
        // width: "100%",
        paddingHorizontal: "20%",
    },
    hintRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: normalize(10),
    },
});