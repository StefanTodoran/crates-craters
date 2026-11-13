import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { UserCredential, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Appearance, BackHandler, Platform, StatusBar as RNStatusBar, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "./components/Header";
import Menu from "./components/Menu";
import GlobalContext, { defaultSettings } from "./GlobalContext";
import EditLevel from "./pages/EditLevel";
import EditorPage from "./pages/EditorPage";
import SettingsPage from "./pages/HelpSettings";
import LevelsPage from "./pages/LevelsPage";
import PlayLevel from "./pages/PlayLevel";
import StorePage from "./pages/StorePage";
import ViewSolution from "./pages/ViewSolution";
import { colors, purpleTheme } from "./Theme";
import LevelCard from "./components/LevelCard";
import { UserAccountDocument, checkForOfficialLevelUpdates, getUserData } from "./util/database";
import { auth } from "./util/firebase";
import { useBooleanSetting, useNumberSetting } from "./util/hooks";
import { createLevel, getData, getLevelData, metadataKeys, storage, syncLevelsWithStorage } from "./util/loader";
import { setHapticsEnabled } from "./util/haptics";
import { usePlaySession } from "./util/playSession";
import { setAppState, setEditorLevel, updateNotificationCount, useAppStore } from "./util/store";
import { toastConfig } from "./util/toasts";
import { usePageNavigation } from "./util/usePageNavigation";
import { Level, PageView, PlayMode, SharedLevel, UserLevel } from "./util/types";

/**
 * App is the main entry point into the application. App contains global state,
 * such as the level in progress, the current page, and settings such as dark mode.
 * App handles the transition between different pages, the loading of settings from
 * storage, and the providing of these settings via a context. 
 */
/**
 * Versions up to 0.4.22 saved the account password in plain text to sign in on launch.
 * Signs in with it once so the user stays logged in under the new session persistence,
 * then deletes it. Returns whether the sign-in succeeded.
 */
let credentialMigrationAttempted = false;
async function migrateSavedCredentials() {
  // Only on the first auth state of a launch, so an explicit sign-out can never
  // be undone by a leftover saved password.
  if (credentialMigrationAttempted) return false;
  credentialMigrationAttempted = true;

  const saved = getData(metadataKeys.userCredentials);
  if (!saved) return false;

  try {
    await signInWithEmailAndPassword(auth, saved.email, saved.password);
    storage.delete(metadataKeys.userCredentials);
    return true;
  } catch (error: any) {
    // Keep them for another try only if the device was offline.
    if (error.code !== "auth/network-request-failed") storage.delete(metadataKeys.userCredentials);
    return false;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("./assets/Montserrat-Regular.ttf"),
    "Montserrat-Medium": require("./assets/Montserrat-Medium.ttf"),
  });

  // Hide the splash explicitly: the native auto-hide can miss its cue after a
  // dev reload on iOS and leave the splash covering the app.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => { });
  }, [fontsLoaded]);

  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();

  const [darkMode, setDarkMode] = useBooleanSetting("darkMode");
  // Native views (the iOS tab bar's glass, system controls) follow the app's own
  // dark mode setting rather than the system one.
  useEffect(() => Appearance.setColorScheme(darkMode ? "dark" : "light"), [darkMode]);
  const [dragSensitivity, setSensitivity] = useNumberSetting("dragSensitivity");
  const [doubleTapDelay, setTapDelay] = useNumberSetting("doubleTapDelay");
  const [playAudio, setAudioMode] = useBooleanSetting("playAudio");

  const toggleDarkMode = useCallback(() => setDarkMode(darkMode => !darkMode), []);
  const toggleAudioMode = useCallback(() => setAudioMode(playAudio => !playAudio), []);
  const [haptics, setHaptics] = useBooleanSetting("haptics");
  useEffect(() => setHapticsEnabled(haptics), [haptics]);
  const toggleHaptics = useCallback(() => setHaptics(haptics => !haptics), []);
  const resetSettings = useCallback(() => {
    setDarkMode(defaultSettings.darkMode);
    setAudioMode(defaultSettings.playAudio);
    setHaptics(defaultSettings.haptics);
    setSensitivity(defaultSettings.dragSensitivity);
    setTapDelay(defaultSettings.doubleTapDelay);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []);

  const levels = useAppStore(state => state.levels);
  const editorLevel = useAppStore(state => state.editorLevel);
  const notificationCounts = useAppStore(state => state.notificationCounts);
  const scrollToLatest = useAppStore(state => state.scrollToLatest);
  const solution = useAppStore(state => state.solution);

  const [userLevels, setUserLevels] = useState<SharedLevel[]>([]); // Kept here so the shared levels fetch isn't redone every time that page mounts.
  const [userCredential, setUserCredential] = useState<UserCredential>();
  const [userData, setUserData] = useState<UserAccountDocument | null>();

  // Firebase Auth persists the session itself (see util/firebase.ts). Players who
  // aren't signed in get a silent anonymous account, so their solutions can be
  // attributed per install; the rest of the app treats anonymous users as signed out.
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        // A persisted session makes any legacy saved password redundant, so drop it
        // before a later sign-out could ever fall back to it.
        credentialMigrationAttempted = true;
        storage.delete(metadataKeys.userCredentials);
        setUserCredential({ user } as UserCredential);
        return;
      }

      setUserCredential(undefined);
      setUserData(undefined);
      if (await migrateSavedCredentials()) return; // Sign-in fires another auth state change.
      if (!user) signInAnonymously(auth).catch(error => console.warn("Anonymous sign-in failed:", error.code));
    });
  }, []);

  // Re-reads the signed-in user, e.g. to pick up a newly verified email.
  const attemptSignIn = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;
    await user.reload().catch(error => console.warn("Failed to refresh user:", error.code));
    setUserCredential({ user: auth.currentUser ?? user } as UserCredential);
  }, []);

  useEffect(() => {
    if (!userCredential) return;

    getUserData(userCredential.user.uid)
      .then((data) => setUserData(data))
      .catch((error) => {
        // First Google sign-in: the auth user exists but hasn't picked a username yet.
        if (String(error?.message).startsWith("No document")) setUserData(null);
        else console.error("Failed to fetch user data:", error);
      });
  }, [userCredential]);

  useEffect(() => {
    syncLevelsWithStorage();
    checkForOfficialLevelUpdates()
      .then((numUpdated) => {
        updateNotificationCount(0, numUpdated);
        syncLevelsWithStorage();
      })
      // Expected when offline: keep using the locally stored levels.
      .catch((error) => console.warn("Failed to check for official level updates:", error));
  }, []);

  const [session, dispatch] = usePlaySession(); // The level being played, its game state and undo history.
  const playLevel = session.level;

  const playLevelFromObj = useCallback((level: Level) => dispatch({ type: "load", level }), []);

  const changePlayLevel = useCallback((uuid: string) => {
    const levelObject = getLevelData(uuid);
    if (levelObject) playLevelFromObj(levelObject);
  }, []);

  // Only walk official levels (in the order the Levels page shows them): the full list
  // also holds custom levels, which "Next Level" would otherwise load in STANDARD mode
  // and then post official solution data for.
  const officialLevels = useMemo(() => levels.filter(level => level.official), [levels]);
  const ownLevels = useMemo(
    () => levels.filter(level => !level.official && level.user_name === (userData ?? devStandIn?.data)?.user_name),
    [levels, userData?.user_name],
  );

  const getNextLevel = useCallback(() => {
    const nextIndex = officialLevels.findIndex(level => level.uuid === playLevel?.uuid) + 1;
    const nextLevel = nextIndex > 0 ? officialLevels[nextIndex] : undefined;
    if (nextLevel) playLevelFromObj(nextLevel);
  }, [officialLevels, playLevel]);

  const startEditingLevel = useCallback((uuid: string) => {
    setEditorLevel(getLevelData(uuid) as UserLevel);
  }, []);

  // Read by the navigation callbacks, which are created once.
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const { view, pageAnim, switchView } = usePageNavigation({
    onNavigate: (from, to) => {
      setAppState({ scrollToLatest: false });
      const { level, mode } = sessionRef.current;

      // Editing from the play page (playtesting) edits the level being played.
      if (from === PageView.PLAY && to === PageView.EDITOR && level) startEditingLevel(level.uuid);

      // Returning from a shared level to the search page: clear the list so it refetches.
      if (from === PageView.PLAY && to === PageView.LEVELS && mode === PlayMode.SHARED) setUserLevels([]);

      if (to < notificationCounts.length) updateNotificationCount(to, 0);
    },
    // Non-standard play modes are set when play begins, so clear them once play is left.
    onPageOpen: (newView) => {
      if (newView !== PageView.PLAY) dispatch({ type: "setMode", mode: PlayMode.STANDARD });
    },
  });

  const createNewLevel = useCallback((level: UserLevel) => {
    createLevel(level);
    setEditorLevel(level);
    syncLevelsWithStorage();
  }, []);

  const playSharedLevel = useCallback((level: SharedLevel | undefined) => {
    if (level) playLevelFromObj(level); // If undefined we simply resume.
    dispatch({ type: "setMode", mode: PlayMode.SHARED });
  }, []);

  const beginPlaytesting = useCallback((uuid: string) => {
    changePlayLevel(uuid);
    dispatch({ type: "setMode", mode: PlayMode.PLAYTEST });
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (view === PageView.PLAY || view === PageView.EDITOR) return true;
      if (view !== PageView.MENU) switchView(PageView.MENU);
      return true;
    });
    return () => subscription.remove();
  }, [view]);

  const returnHome = useCallback(() => switchView(PageView.MENU), []);
  const requestScrollToLatest = useCallback(() => {
    setAppState({ scrollToLatest: false });
    setTimeout(() => setAppState({ scrollToLatest: true }), 100);
  }, []);

  // This is used so that the level select component only needs to calculate
  // the level select element height one time.
  const [levelElementHeight, setElementHeight] = useState(0);

  // Memoized so context consumers (every board tile, button, etc.) don't re-render
  // whenever App does, e.g. on every game move.
  const globalContext = useMemo(
    () => ({
      darkMode, dragSensitivity, doubleTapDelay, playAudio, haptics,
      userCredential: userCredential ?? devStandIn?.credential,
      userData: userData ?? devStandIn?.data,
    }),
    [darkMode, dragSensitivity, doubleTapDelay, playAudio, haptics, userCredential, userData],
  );

  const panel = useMemo(() => panelStyle(pageAnim, darkMode, win.height), [darkMode, win.height]);

  if (!fontsLoaded) return <></>;
  return (
    <GlobalContext.Provider value={globalContext}>
      {/* Menu and the page panel's background extend edge-to-edge on iOS (matching
          Android); only the page contents and toasts are inset into the safe area. */}
      <View style={styles.container}>

        {/* Measure a level card once at startup, hidden under the menu. Otherwise the
            first level list to open measures one itself and only then mounts its cards,
            which lands in the middle of the page's slide-in and stalls it. */}
        {!levelElementHeight && officialLevels.length > 0 && <View
          pointerEvents="none"
          style={styles.measurer}
          onLayout={(event) => setElementHeight(event.nativeEvent.layout.height)}
        >
          <LevelCard onPlay={() => { }} levelIndex={0} level={officialLevels[0]} darkMode={darkMode} useTheme={purpleTheme} />
        </View>}

        <Menu notificationCounts={notificationCounts} openPage={switchView} />

        <Animated.View
          style={panel}
          pointerEvents={view === PageView.MENU ? "none" : "auto"}
        >
          {/* Static insets instead of a SafeAreaView: this panel is translated while it
              animates, and a SafeAreaView would re-measure mid-slide and jump. iOS only,
              like the SafeAreaView it replaces (Android pads via StatusBar.currentHeight). */}
          <View style={[styles.safeArea, Platform.OS === "ios" && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {![PageView.PLAY, PageView.EDITOR, PageView.SOLUTION].includes(view) && <View style={styles.header}>
            <Header
              pageView={view}
              returnHome={returnHome}
              scrollToLatest={requestScrollToLatest}
            />
          </View>}

          <View style={styles.page}>
            {view === PageView.LEVELS &&
              <LevelsPage
                viewCallback={switchView}
                playLevelCallback={changePlayLevel}
                playSharedLevelCb={playSharedLevel}
                scrollTo={scrollToLatest ? "latest" : (!session.game?.won ? playLevel?.uuid : undefined)}
                levels={officialLevels}
                userLevels={userLevels}
                setUserLevels={setUserLevels}
                elementHeight={levelElementHeight}
                storeElementHeightCallback={setElementHeight}
              />
            }

            {view === PageView.PLAY && playLevel && session.game &&
              <PlayLevel
                viewCallback={switchView}
                nextLevelCallback={getNextLevel}
                dispatch={dispatch}
                level={playLevel}
                game={session.game}
                canUndo={session.checkpoints.length > 0}
                mode={session.mode}
              />
            }

            {view === PageView.MANAGE &&
              <EditorPage
                viewCallback={switchView}
                playLevelCallback={beginPlaytesting}
                startEditingCallback={startEditingLevel}
                createNewLevelCallback={createNewLevel}
                levels={ownLevels}
                editorLevel={editorLevel}
                elementHeight={levelElementHeight}
                storeElementHeightCallback={setElementHeight}
              />
            }

            {view === PageView.EDITOR &&
              <EditLevel
                viewCallback={switchView}
                level={editorLevel!}
                levelCallback={setEditorLevel}
                playtestLevel={beginPlaytesting}
              />
            }

            {view === PageView.SOLUTION && solution &&
              <ViewSolution
                viewCallback={switchView}
                level={solution!.level} // Set by showSolution() before navigating here.
                onBack={() => switchView(solution!.backView, solution!.backPage)}
              />
            }

            {view === PageView.STORE &&
              <StorePage
                attemptSignIn={attemptSignIn}
                setUserCredential={setUserCredential}
              />
            }

            {view === PageView.SETTINGS &&
              <SettingsPage
                darkModeCallback={toggleDarkMode}
                audioModeCallback={toggleAudioMode}
                hapticsCallback={toggleHaptics}
                setSensitivityCallback={setSensitivity}
                setTapDelayCallback={setTapDelay}
                resetSettingsCallback={resetSettings}
              />
            }
          </View>
          </View>
        </Animated.View>

        {/* Toast is absolutely positioned, so a SafeAreaView parent has no effect;
            offset it below the status bar / Dynamic Island explicitly. */}
        <Toast
          position="top"
          topOffset={insets.top + 8}
          config={toastConfig}
        />
      </View>

      <StatusBar translucent={true} hidden={true} />
    </GlobalContext.Provider>
  );
}

/**
 * Development only: a local stand-in for a signed-in account on the iOS simulator, so
 * signed-in screens (editor, profile) can be used without real credentials. Enabled by
 * EXPO_PUBLIC_DEV_STANDIN_ACCOUNT=1 in a git-ignored .env.local; never in release builds,
 * where __DEV__ is false. A real sign-in takes precedence. The uid isn't a real Firebase
 * user, so server writes (sharing, likes) are rejected by the security rules.
 */
const devStandIn = __DEV__ && Platform.OS === "ios" && process.env.EXPO_PUBLIC_DEV_STANDIN_ACCOUNT === "1" ? {
  credential: { user: { uid: "dev-standin", email: "standin@example.com", emailVerified: true, providerData: [] } } as unknown as UserCredential,
  data: { user_name: "CrateMaster", user_email: "standin@example.com", likes: [], attempted: [], completed: [], coins: 0 } as unknown as UserAccountDocument,
} : undefined;

function panelStyle(animState: Animated.Value, darkMode: boolean, screenHeight: number) {
  return {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden", // Clip children to the animated rounded corners.
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkMode ? "black" : "white",
    // iOS: no opacity. Any opacity on an ancestor stops the native tab bar from drawing
    // its Liquid Glass platter (and it never recovers), so the panel slides in like a sheet.
    opacity: Platform.OS === "ios" ? undefined : animState,
    borderRadius: animState.interpolate({
      inputRange: [0, 0.75, 1],
      outputRange: [40, 30, 0],
    }),
    transform: [{
      translateY: animState.interpolate({
        inputRange: [0, 1],
        outputRange: [Platform.OS === "ios" ? screenHeight : screenHeight * 0.2, 0],
      }),
    }],
  } as const;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  measurer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  safeArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  // No opacity here: the header already fades with its parent modal, and a second
  // opacity on the same value made it lag the panel (effective opacity anim²).
  header: {
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: "2%",
    width: "100%",
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.2),
  },
});
