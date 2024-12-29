import { UserCredential, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import InputLine from "../components/InputLine";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { UserAccountDocument, createDocument } from "../util/database";
import { auth } from "../util/firebase";
import { getData, getLocalUserData, metadataKeys, setData } from "../util/loader";

const emailRegex = new RegExp(String.raw`^(\S+@\S+\.\S+)?$`);

interface Props {
    setUserCredential: (newCredential: UserCredential) => void,
}

export default function LoginPage({ setUserCredential }: Props) {
    const { darkMode } = useContext(GlobalContext);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    let hint;
    if (!password) hint = "Please input a password.";
    if (password && password.length < 6) hint = "Password must be at least 6 characters long!";
    if (!username) hint = "A username is required.";
    if (!email) hint = "An email address is required.";
    if (email && !emailRegex.test(email)) hint = "Please use a valid email address!";
    if (!email && !password) hint = "Please input an email, username, and password.";

    const usernameRegex = /[^a-z0-9_$!]/gi;

    return (
        <SubpageContainer center>
            <InputLine
                label={"Email"}
                value={email}
                onChange={setEmail}
                darkMode={darkMode}
                fullBorder
            />
            <InputLine
                label={"Username"}
                value={username}
                onChange={setUsername}
                darkMode={darkMode}
                filterPattern={usernameRegex}
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
                        const userData = getLocalUserData();

                        createUserWithEmailAndPassword(auth, username, password)
                            .then((userCredential) => {
                                const accountDoc: UserAccountDocument = {
                                    user_email: username,
                                    likes: [],
                                    attempted: attemptedLevels,
                                    completed: completedLevels,
                                    coins: coinBalance,
                                    online_joined: Timestamp.now(),
                                    local_uuid: userData.uuid,
                                    local_joined: Timestamp.fromDate(new Date(userData.joined)),
                                };
                                createDocument("userAccounts", username, accountDoc);
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