import { AuthCredential, EmailAuthProvider, UserCredential, reauthenticateWithCredential, sendEmailVerification, signOut } from "firebase/auth";
import { ReactNode, useContext, useState } from "react";
import { Image, ImageSourcePropType, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import InputLine from "../components/InputLine";
import { ListGroup, ListRow } from "../components/ListGroup";
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

const theme = colors.YELLOW_THEME;
const MAX_USERNAME_LENGTH = 32;

interface Props {
    attemptSignIn: () => Promise<void>,
    setUserCredential: (newCredential: UserCredential | undefined) => void,
}

export default function ProfilePage({ attemptSignIn, setUserCredential }: Props) {
    const { userData, userCredential, darkMode } = useContext(GlobalContext);
    const refreshCredentials = (onFinish: () => void) => {
        attemptSignIn().then(onFinish);
    }

    const [deleting, setDeleting] = useState(false);
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [newUsername, setNewUsername] = useState("");

    if (!userCredential) return <LoginPage setUserCredential={setUserCredential} />;
    const user = userCredential.user;

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
                await createUserAccount(user.uid, newAccountDoc(user.email!, newUsername));
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
                <FormPage
                    darkMode={darkMode}
                    title="Choose a username"
                    description="It's shown on the levels you share."
                >
                    <InputLine
                        label="Username"
                        value={newUsername}
                        onChange={setNewUsername}
                        filterPattern={/[^a-z0-9_$!]/gi}
                        darkMode={darkMode}
                    />
                    <View style={styles.helperRow}>
                        <Text style={styles.helper}>Letters, numbers, _ $ !</Text>
                        <Text style={[styles.helper, newUsername.length > MAX_USERNAME_LENGTH && styles.helperError]}>
                            {newUsername.length}/{MAX_USERNAME_LENGTH}
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <SimpleButton onPress={finishSignUp}
                            text={busy ? "Creating Account..." : "Continue"}
                            icon={graphics.SIGNUP_ICON}
                            theme={theme}
                            disabled={!newUsername || newUsername.length > MAX_USERNAME_LENGTH || busy}
                            main
                        />
                    </View>
                    <TextButton
                        text="Use a different account"
                        onPress={() => { signOutEverywhere().then(() => setUserCredential(undefined)); }}
                    />
                    <Text style={[styles.caption, styles.centered]}>Signed in as {user.email}</Text>
                </FormPage>
            </SubpageContainer>
        );
    }

    const hasPassword = usesPassword(user);

    const deleteAccount = async () => {
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
            <FormPage
                darkMode={darkMode}
                title="Delete account"
                description={`This permanently deletes your account and frees your username. Levels you shared stay playable, credited to "${DELETED_USER_NAME}".`}
            >
                {hasPassword && <InputLine
                    label="Confirm Password"
                    value={password}
                    onChange={setPassword}
                    isSensitive
                    doFilter={false}
                    darkMode={darkMode}
                />}
                <View style={styles.actions}>
                    <SimpleButton onPress={deleteAccount}
                        text={hasPassword ? "Delete Forever" : "Confirm with Google"}
                        icon={graphics.DELETE_ICON_WHITE}
                        theme={colors.RED_THEME}
                        disabled={(hasPassword && password.length < 6) || busy}
                        main
                    />
                </View>
                <TextButton text="Cancel" onPress={() => { setDeleting(false); setPassword(""); }} />
            </FormPage>
        </SubpageContainer>
    );

    const signOutPressed = () => {
        signOutEverywhere()
            .then(() => {
                setUserCredential(undefined);
                Toast.show({ type: "success", text1: "Signed out.", text2: "You are no longer signed in." });
            })
            .catch((error) => {
                Toast.show({ type: "error", text1: "Sign out failed.", text2: `Error code: ${error.code}. Please try again.` });
            });
    };

    const resendVerification = () => {
        sendEmailVerification(user)
            .then(() => {
                Toast.show({ type: "success", text1: "Verification email sent!", text2: `Check your inbox at ${user.email}.` });
            })
            .catch((error) => {
                Toast.show({ type: "error", text1: "Couldn't send the email.", text2: `Error code: ${error.code}.` });
            });
    };

    const username = userData?.user_name ?? "";
    const joined = userData?.online_joined?.toDate?.();

    return (
        <SubpageContainer onRefresh={refreshCredentials}>
            <View style={styles.page}>
                {/* Identity */}
                <View style={styles.header}>
                    <View style={[styles.avatar, { backgroundColor: darkMode ? theme.MAIN_TRANSPARENT(0.25) : theme.MAIN_COLOR }]}>
                        <Text style={[styles.avatarText, { color: darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR }]} allowFontScaling={false}>
                            {(username[0] ?? "?").toUpperCase()}
                        </Text>
                    </View>
                    <Text style={[styles.username, { color: darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR }]} numberOfLines={1}>
                        {username || "Loading..."}
                    </Text>
                    <Text style={styles.caption} numberOfLines={1}>{user.email}</Text>
                    {joined && <Text style={styles.caption}>
                        Member since {joined.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Text>}
                </View>

                {/* Stats */}
                {userData && <View style={styles.stats}>
                    <Stat darkMode={darkMode} icon={graphics.FLAG_ICON} value={userData.completed.length} label="Solved" />
                    <Stat darkMode={darkMode} icon={graphics.LIKE_ICON} value={userData.likes.length} label="Liked" />
                    <Stat darkMode={darkMode} icon={graphics.COIN} value={userData.coins} label="Coins" />
                </View>}

                {/* Only while unverified: verified accounts have nothing to do here. */}
                {!user.emailVerified && <View style={[styles.banner, { backgroundColor: theme.MAIN_TRANSPARENT(darkMode ? 0.15 : 0.35) }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, { color: darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR }]}>Verify your email</Text>
                        <Text style={styles.caption}>Check your inbox for a verification link.</Text>
                    </View>
                    <TextButton text="Resend" onPress={resendVerification} color={darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR} />
                </View>}

                <ListGroup>
                    <ListRow title="Contact Support" onPress={() => Linking.openURL("mailto:info@todoran.dev?subject=Crates%20%26%20Craters")} />
                    <ListRow title="Sign Out" onPress={signOutPressed} last />
                </ListGroup>

                <ListGroup>
                    <ListRow title="Delete Account" onPress={() => setDeleting(true)} destructive last />
                </ListGroup>
            </View>
        </SubpageContainer>
    );
}

/** A centered single-task page: title, explanation, then the form. */
function FormPage({ title, description, darkMode, children }: { title: string, description: string, darkMode: boolean, children: ReactNode }) {
    return (
        <View style={styles.form}>
            <Text style={[styles.formTitle, { color: darkMode ? colors.OFF_WHITE : colors.TEXT_COLOR }]}>{title}</Text>
            <Text style={[styles.formDescription]}>{description}</Text>
            {children}
        </View>
    );
}

function Stat({ icon, value, label, darkMode }: { icon: ImageSourcePropType, value: number, label: string, darkMode: boolean }) {
    return (
        <View style={[styles.stat, { backgroundColor: theme.MAIN_TRANSPARENT(darkMode ? 0.12 : 0.25) }]}>
            <View style={styles.statValueRow}>
                <Image source={icon} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: darkMode ? theme.MAIN_COLOR : theme.TINT_COLOR }]} allowFontScaling={false}>{value}</Text>
            </View>
            <Text style={styles.statLabel} allowFontScaling={false}>{label}</Text>
        </View>
    );
}

function TextButton({ text, onPress, color }: { text: string, onPress: () => void, color?: string }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.5 }]}>
            <Text style={[styles.textButtonText, { color: color ?? colors.DIM_GRAY }]}>{text}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    page: {
        width: "100%",
        paddingTop: normalize(24),
        paddingBottom: normalize(40),
    },
    header: {
        alignItems: "center",
        marginBottom: normalize(20),
    },
    avatar: {
        width: normalize(84),
        height: normalize(84),
        borderRadius: normalize(42),
        alignItems: "center",
        justifyContent: "center",
        marginBottom: normalize(12),
    },
    avatarText: {
        fontFamily: "Montserrat-Medium",
        fontSize: normalize(38),
    },
    username: {
        fontFamily: "Montserrat-Medium",
        fontWeight: "bold",
        fontSize: normalize(24),
        marginBottom: normalize(4),
    },
    caption: {
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(13),
        color: colors.DIM_GRAY,
        marginTop: normalize(2),
    },
    centered: {
        textAlign: "center",
    },
    stats: {
        flexDirection: "row",
        gap: normalize(10),
        marginBottom: normalize(16),
    },
    stat: {
        flex: 1,
        alignItems: "center",
        paddingVertical: normalize(12),
        borderRadius: normalize(14),
    },
    statValueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: normalize(6),
    },
    statIcon: {
        width: normalize(20),
        height: normalize(20),
    },
    statValue: {
        fontFamily: "Montserrat-Medium",
        fontWeight: "bold",
        fontSize: normalize(22),
    },
    statLabel: {
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(12),
        color: colors.DIM_GRAY,
        marginTop: normalize(2),
    },
    banner: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: normalize(14),
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(16),
        marginBottom: normalize(16),
    },
    rowTitle: {
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(16),
    },
    form: {
        width: "100%",
    },
    actions: {
        alignItems: "center", // Buttons size to their label instead of the full width.
    },
    formTitle: {
        fontFamily: "Montserrat-Medium",
        fontWeight: "bold",
        fontSize: normalize(26),
        marginBottom: normalize(8),
    },
    formDescription: {
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(15),
        lineHeight: normalize(21),
        color: colors.DIM_GRAY,
        marginBottom: normalize(20),
    },
    helperRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: -normalize(4),
        marginBottom: normalize(20),
        paddingHorizontal: normalize(4),
    },
    helper: {
        fontFamily: "Montserrat-Regular",
        fontSize: normalize(12),
        color: colors.DIM_GRAY,
    },
    helperError: {
        color: colors.RED_THEME.TINT_COLOR,
    },
    textButton: {
        alignSelf: "center",
        paddingVertical: normalize(10),
        paddingHorizontal: normalize(12),
        marginTop: normalize(6),
    },
    textButtonText: {
        fontFamily: "Montserrat-Medium",
        fontSize: normalize(15),
    },
});
