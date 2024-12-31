import { UserCredential, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useContext, useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import InputLine from "../components/InputLine";
import SimpleButton from "../components/SimpleButton";
import SubpageContainer from "../components/SubpageContainer";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { UserAccountDocument, createDocument, doesEntryExist } from "../util/database";
import { auth } from "../util/firebase";
import { getData, getLocalUserData, metadataKeys, setData } from "../util/loader";

const win = Dimensions.get("window");
const emailRegex = /^(\S+@\S+\.\S+)?$/;

interface Props {
    setUserCredential: (newCredential: UserCredential) => void,
}

enum PageMode {
    UNSET = 0,
    LOGIN = 1,
    SIGNUP = 2,
}

export default function LoginPage({ setUserCredential }: Props) {
    const { darkMode } = useContext(GlobalContext);
    const [pageMode, setPageMode] = useState<PageMode>(PageMode.UNSET);

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    let hint;
    if (!password) hint = "Please input a password.";
    if (password && password.length < 6) hint = "Password must be at least 6 characters long!";
    if (!username && pageMode === PageMode.SIGNUP) hint = "A username is required.";
    if (!email) hint = "An email address is required.";
    if (email && !emailRegex.test(email)) hint = "Please use a valid email address!";

    const usernameRegex = /[^a-z0-9_$!]/gi;

    const canLogin = email && emailRegex.test(email) && password && password.length >= 6;
    const canCreateAccount = username && canLogin;

    return (
        <SubpageContainer center>
            {
                pageMode === PageMode.UNSET && <>
                    <View style={styles.pageModeRow}>
                        <SimpleButton
                            text="Sign In"
                            icon={graphics.SIGNUP_ICON}
                            theme={colors.YELLOW_THEME}
                            onPress={() => setPageMode(PageMode.LOGIN)}
                            fillWidth
                            square
                            extraMargin={[0, 8]}
                            main
                            />
                        <SimpleButton
                            text="Create Account"
                            onPress={() => setPageMode(PageMode.SIGNUP)}
                            theme={colors.YELLOW_THEME}
                            icon={graphics.FLAG}
                            square
                            fillWidth
                            extraMargin={[0, 8]}
                        />
                    </View>
                </>
            }

            {
                pageMode !== PageMode.UNSET && <>
                    <InputLine
                        label={"Email"}
                        value={email}
                        onChange={setEmail}
                        darkMode={darkMode}
                        doFilter={false}
                        fullBorder
                    />
                    {pageMode === PageMode.SIGNUP && <InputLine
                        label={"Username"}
                        value={username}
                        onChange={setUsername}
                        darkMode={darkMode}
                        filterPattern={usernameRegex}
                        fullBorder
                    />}
                    <InputLine
                        label={"Password"}
                        value={password}
                        onChange={setPassword}
                        darkMode={darkMode}
                        doFilter={false}
                        fullBorder
                        isSensitive
                    />
                </>
            }

            {pageMode !== PageMode.UNSET && <>
                <View style={styles.hintRow}>
                    <Text style={TextStyles.paragraph(darkMode)}>{hint}</Text>
                </View>

                <View style={styles.buttonsRow}>
                    <SimpleButton
                        icon={graphics.YELLOW_BACK_ICON}
                        theme={colors.YELLOW_THEME}
                        onPress={() => setPageMode(PageMode.UNSET)}
                        extraMargin={6}
                        square
                    />
                    <View style={styles.buttonGap} />

                    {pageMode === PageMode.LOGIN && <SimpleButton
                        text="Sign In"
                        icon={graphics.SIGNUP_ICON}
                        theme={colors.YELLOW_THEME}
                        onPress={() => {
                            setLoading(true);
                            signInWithEmailAndPassword(auth, email, password)
                                .then((userCredential) => {
                                    setUserCredential(userCredential);
                                    setData(metadataKeys.userCredentials, { email: email, password: password });
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
                                })
                                .finally(() => setLoading(false));
                        }}
                        disabled={!canLogin || loading}
                        extraMargin={6}
                        square
                        main
                    />}
                    {pageMode === PageMode.SIGNUP && <SimpleButton
                        text="Create Account"
                        icon={graphics.SIGNUP_ICON}
                        onPress={async () => {
                            const coinBalance = getData(metadataKeys.coinBalance) || 0;
                            const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];
                            const completedLevels = getData(metadataKeys.completedLevels) || [];
                            const userData = getLocalUserData();

                            setLoading(true);

                            const usernameExists = await doesEntryExist("userAccounts", "__name__", username);
                            if (usernameExists) {
                                Toast.show({
                                    type: "error",
                                    text1: "Username already taken.",
                                    text2: "Please choose a different username.",
                                });
                                setLoading(false);
                                return;
                            }

                            createUserWithEmailAndPassword(auth, email, password)
                                .then((userCredential) => {
                                    const accountDoc: UserAccountDocument = {
                                        user_email: email,
                                        user_name: username,
                                        likes: [],
                                        attempted: attemptedLevels,
                                        completed: completedLevels,
                                        coins: coinBalance,
                                        online_joined: Timestamp.now(),
                                        local_uuid: userData.uuid,
                                        local_joined: Timestamp.fromDate(new Date(userData.joined)),
                                    };
                                    createDocument("userAccounts", email, accountDoc)
                                        .then(() => {
                                            setData(metadataKeys.userCredentials, { email: email, password: password });
                                            setUserCredential(userCredential);
                                            Toast.show({
                                                type: "success",
                                                text1: "Account creation succeeded!",
                                                text2: `You are now logged in as ${userCredential.user.email}.`,
                                            });

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
                                        })
                                        .catch((error) => {
                                            Toast.show({
                                                type: "error",
                                                text1: "Account creation failed.",
                                                text2: `Error code: ${error.code}. Please contact support.`,
                                            });
                                        });
                                })
                                .catch((error) => {
                                    Toast.show({
                                        type: "error",
                                        text1: "Account creation failed.",
                                        text2: `Error code: ${error.code}. Please try again.`,
                                    });
                                })
                                .finally(() => setLoading(false));
                        }}
                        theme={colors.YELLOW_THEME}
                        disabled={!canCreateAccount || loading}
                        extraMargin={6}
                        square
                        main
                    />}
                </View>
            </>}
        </SubpageContainer>
    );
}

const styles = StyleSheet.create({
    pageModeRow: {
        alignItems: "center",
        justifyContent: "center",
        // width: win.width * 0.45,
        marginHorizontal: win.width * 0.225,
    },
    buttonsRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: normalize(100),
    },
    hintRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: normalize(10),
        marginBottom: normalize(15),
    },
    buttonGap: {
        width: normalize(5),
    },
});