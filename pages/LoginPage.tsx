import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, graphics } from "../Theme";
import TextStyles, { normalize } from "../TextStyles";
import GlobalContext from "../GlobalContext";
import { UserCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../util/firebase";
import { createDocument } from "../util/database";
import { getData, metadataKeys, setData } from "../util/loader";

import SubpageContainer from "../components/SubpageContainer";
import SimpleButton from "../components/SimpleButton";
import InputLine from "../components/InputLine";
import Toast from "react-native-toast-message";

const emailRegex = new RegExp(String.raw`^(\S+@\S+\.\S+)?$`);

interface Props {
    setUserCredential: (newCredential: UserCredential) => void,
}

export default function LoginPage({ setUserCredential }: Props) {
    const { darkMode } = useContext(GlobalContext);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    let hint;
    if (!password) hint = "Please input a password.";
    if (password && password.length < 6) hint = "Password must be at least 6 characters long!";
    if (!username) hint = "Please provide a username.";
    if (username && !emailRegex.test(username)) hint = "Username must be a valid email address!";
    if (!username && !password) hint = "Please input a username and password.";

    return (
        <SubpageContainer center>
            <InputLine
                label={"Username"}
                value={username}
                onChange={setUsername}
                darkMode={darkMode}
                fullBorder
            />
            <InputLine
                label={"Password"}
                value={password}
                onChange={setPassword}
                darkMode={darkMode}
                fullBorder
                isSensitive
            />

            <View style={styles.buttonsRow}>
                <SimpleButton
                    text="Sign In"
                    icon={graphics.SIGNUP_ICON}
                    theme={colors.YELLOW_THEME}
                    onPress={() => {
                        signInWithEmailAndPassword(auth, username, password)
                            .then((userCredential) => {
                                setUserCredential(userCredential);
                                setData(metadataKeys.userCredentials, { username: username, password: password });
                                Toast.show({
                                    type: "success",
                                    text1: "Account login succeeded!",
                                    text2: `You are now logged in as ${userCredential.user.email}.`,
                                });
                            })
                            .catch((error) => {
                                Toast.show({
                                    type: "error",
                                    text1: "Account login failed.",
                                    text2: `Error code: ${error.code}. Please try again.`,
                                });
                            });
                    }}
                    main
                />
                <SimpleButton
                    text="Create Account"
                    onPress={() => {
                        const coinBalance = getData(metadataKeys.coinBalance) || 0;
                        const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];
                        const completedLevels = getData(metadataKeys.completedLevels) || [];

                        createUserWithEmailAndPassword(auth, username, password)
                            .then((userCredential) => {
                                createDocument("userAccounts", username, {
                                    user_email: username,
                                    likes: [],
                                    attempted: attemptedLevels,
                                    completed: completedLevels,
                                    coins: coinBalance,
                                });
                                setData(metadataKeys.userCredentials, { username: username, password: password });
                                // TODO: Failure to create this document should be handled somehow.

                                setUserCredential(userCredential);
                                Toast.show({
                                    type: "success",
                                    text1: "Account creation succeeded!",
                                    text2: `You are now logged in as ${userCredential.user.email}.`,
                                });
                            })
                            .catch((error) => {
                                Toast.show({
                                    type: "error",
                                    text1: "Account creation failed.",
                                    text2: `Error code: ${error.code}. Please try again.`,
                                });
                            });
                    }}
                    theme={colors.YELLOW_THEME}
                    extraMargin
                />
            </View>

            <View style={styles.hintRow}>
                <Text style={TextStyles.paragraph(darkMode)}>{hint}</Text>
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