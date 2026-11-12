import { AuthCredential, EmailAuthProvider, UserCredential, reauthenticateWithCredential, sendEmailVerification, signOut } from "firebase/auth";
import { useContext, useState } from "react";
import { Dimensions, Linking, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import InputCard from "../components/InputCard";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { auth } from "../util/firebase";
import { DELETED_USER_NAME, createUserAccount, deleteUserAccount, isUsernameTaken, newAccountDoc } from "../util/database";
import { getGoogleCredential, signOutOfGoogle, usesPassword } from "../util/googleAuth";
import { metadataKeys, storage } from "../util/loader";
import LoginPage from "./LoginPage";

const win = Dimensions.get("window");

interface Props {
    attemptSignIn: () => Promise<void>,
    setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function ProfilePage({ attemptSignIn, setUserCredential }: Props) {
    const { userData, userCredential } = useContext(GlobalContext);
    const refreshCredentials = (onFinish: () => void) => {
        attemptSignIn().then(onFinish);
    }

    const [deleting, setDeleting] = useState(false);
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [newUsername, setNewUsername] = useState("");

    if (!userCredential) return <LoginPage setUserCredential={setUserCredential} />;

    const signOutEverywhere = () => {
        storage.delete(metadataKeys.userCredentials); // Legacy saved password, if any.
        signOutOfGoogle();
        return signOut(auth);
    };

    // First Google sign-in: there's no account doc until a username is picked.
    if (userData === null) {
        const finishSignUp = async () => {
            setBusy(true);
            try {
                if (await isUsernameTaken(newUsername)) {
                    Toast.show({ type: "error", text1: "Username already taken.", text2: "Please choose a different username." });
                    return;
                }
                await createUserAccount(userCredential.user.uid, newAccountDoc(userCredential.user.email!, newUsername));
                await attemptSignIn(); // Re-fetches the new account doc.
                Toast.show({ type: "success", text1: "Account created!", text2: `Welcome, ${newUsername}!` });
            } catch (error: any) {
                Toast.show({ type: "error", text1: "Account creation failed.", text2: `Error code: ${error.code}. Please try again.` });
            } finally {
                setBusy(false);
            }
        };

        return (
            <SubpageContainer center>
                <InputCard
                    title={"Choose a Username"}
                    hints={[`Signed in as ${userCredential.user.email}.`, "Your username is shown on levels you share."]}
                    fields={[{
                        label: "Username",
                        value: newUsername,
                        onChange: setNewUsername,
                        filterPattern: /[^a-z0-9_$!]/gi,
                    }]}
                    buttonText="Cancel"
                    buttonCallback={() => { signOutEverywhere().then(() => setUserCredential(undefined)); }}
                />
                <View style={styles.buttonsRow}>
                    <SimpleButton onPress={finishSignUp}
                        text="Finish"
                        icon={graphics.SIGNUP_ICON}
                        theme={colors.YELLOW_THEME}
                        disabled={!newUsername || newUsername.length > 32 || busy}
                        fillWidth
                        extraMargin={[6, 5]}
                        square
                        main
                    />
                </View>
            </SubpageContainer>
        );
    }

    const hasPassword = usesPassword(userCredential.user);

    const deleteAccount = async () => {
        const user = userCredential.user;
        setBusy(true);
        try {
            // Firebase only deletes users who signed in recently, so confirm who this is first.
            let credential: AuthCredential | null = hasPassword
                ? EmailAuthProvider.credential(user.email!, password)
                : await getGoogleCredential();
            if (!credential) return; // Google picker cancelled.
            await reauthenticateWithCredential(user, credential);
            await deleteUserAccount(user, userData?.user_name);
            storage.delete(metadataKeys.userCredentials);
            signOutOfGoogle();
            setDeleting(false);
            setUserCredential(undefined);
            Toast.show({
                type: "success",
                text1: "Account deleted.",
                text2: "Your account and profile have been removed.",
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Account deletion failed.",
                text2: error.code === "auth/invalid-credential" ? "Incorrect password." : `Error code: ${error.code}. Please try again.`,
            });
        } finally {
            setPassword("");
            setBusy(false);
        }
    };

    if (deleting) return (
        <SubpageContainer center>
            <InputCard
                title={"Delete Account"}
                hints={[
                    "This permanently deletes your account and frees your username.",
                    `Levels you published stay playable, credited to "${DELETED_USER_NAME}".`,
                ]}
                fields={hasPassword ? [{
                    label: "Confirm Password",
                    value: password,
                    onChange: setPassword,
                    isSensitive: true,
                }] : []}
                buttonText="Cancel"
                buttonCallback={() => { setDeleting(false); setPassword(""); }}
            />
            <View style={styles.buttonsRow}>
                <SimpleButton onPress={deleteAccount}
                    text={hasPassword ? "Delete Forever" : "Confirm with Google"}
                    icon={graphics.DELETE_ICON}
                    theme={colors.RED_THEME}
                    disabled={(hasPassword && password.length < 6) || busy}
                    fillWidth
                    extraMargin={[6, 5]}
                    square
                />
            </View>
        </SubpageContainer>
    );

    return (
        <SubpageContainer onRefresh={refreshCredentials} center>
            <InputCard
                title={"Profile"}
                hints={[
                    `UID: ${userCredential?.user.uid}`,
                    userCredential?.user.emailVerified ? "Email verified" : "Email address unverified",
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
                    signOutEverywhere()
                        .then(() => {
                            setUserCredential(undefined);

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
                <SimpleButton onPress={() => {
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
                    text="Resend Email"
                    icon={graphics.MAIL_ICON}
                    theme={colors.YELLOW_THEME}
                    disabled={userCredential.user.emailVerified}
                    fillWidth
                    extraMargin={[6, 5]}
                    square
                />
                <SimpleButton onPress={() => Linking.openURL("mailto:info@todoran.dev?subject=Crates%20%26%20Craters")}
                    text="Contact Support"
                    icon={graphics.GET_SUPPORT_ICON}
                    theme={colors.YELLOW_THEME}
                    fillWidth
                    extraMargin={[6, 5]}
                    square
                />
            </View>
            <View style={styles.buttonsRow}>
                <SimpleButton onPress={() => setDeleting(true)}
                    text="Delete Account"
                    icon={graphics.DELETE_ICON}
                    theme={colors.RED_THEME}
                    fillWidth
                    extraMargin={[6, 5]}
                    square
                />
            </View>

        </SubpageContainer>
    );
}

const styles = StyleSheet.create({
    buttonsRow: {
        marginTop: normalize(5),
        flexDirection: "row",
        justifyContent: "center",
        width: win.width * 0.45,
        marginHorizontal: win.width * 0.225,
    },
    hintRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: normalize(10),
    },
});