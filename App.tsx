import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { UserCredential, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Appearance, BackHandler, Dimensions, Platform, StatusBar as RNStatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import Header from "./components/Header";
import Menu from "./components/Menu";
import GlobalContext from "./GlobalContext";
import EditLevel from "./pages/EditLevel";
import EditorPage from "./pages/EditorPage";
import SettingsPage from "./pages/HelpSettings";
import LevelsPage from "./pages/LevelsPage";
import PlayLevel from "./pages/PlayLevel";
import StorePage from "./pages/StorePage";
import ViewSolution from "./pages/ViewSolution";
import { colors } from "./Theme";
import { UserAccountDocument, checkForOfficialLevelUpdates, getUserData } from "./util/database";
import { doPageChange, doPageOpened, eventEmitter, setInitialSubpage, setPageAnimating } from "./util/events";
import { auth } from "./util/firebase";
import { useBooleanSetting, useNumberSetting } from "./util/hooks";
import { createLevel, getData, getLevelData, getStoredLevels, metadataKeys, storage } from "./util/loader";
import { Game, initializeGameObj } from "./util/logic";
import { toastConfig } from "./util/toasts";
import { Level, PageView, PlayMode, SharedLevel, UserLevel } from "./util/types";

const win = Dimensions.get("window");

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

  const pageAnim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    // Make sure than 0 <= animState <= 1, interpolated styles assume on this.
    Animated.timing(pageAnim, {
      toValue: animState,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  const [view, setView] = useState(PageView.MENU);
  const [scrollToBottom, setScrollToBottom] = useState(false);

  useEffect(() => {
    const listener = eventEmitter.addListener("pageWasChanged", () => setScrollToBottom(false));
    return () => listener.remove();
  }, []);

  const pendingOpen = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const start = pendingOpen.current;
    if (!start) return;
    pendingOpen.current = undefined;
    // Wait one frame after the commit so the page is actually on screen.
    requestAnimationFrame(start);
  }, [view]);

  const openPageView = useCallback((newView: PageView, pageNum?: number, sameView?: boolean) => {
    if (pageNum !== undefined && !sameView) {
      // The page mounts fresh, so its Subpages can start on the right tab instead of
      // sliding in tab 0 and cross-fading after the open animation.
      setInitialSubpage(pageNum);
    }
    setPageAnimating();
    const startOpen = () => setAnimTo(1, () => {
      if (pageNum !== undefined && sameView) doPageChange(pageNum);
      doPageOpened();
    });
    if (sameView) {
      startOpen(); // Already mounted, nothing to wait for.
    } else {
      // Start the slide only once the new page has rendered. The slide runs on the
      // native driver, so starting it immediately let it finish while JS was still
      // mounting the page, leaving an empty panel that filled in at the end.
      pendingOpen.current = startOpen;
      setView(newView);
    }

    // Non-standard play modes are set when calling App.tsx to 
    // begin play, and therefore should be cleared when play is left.
    if (newView !== PageView.PLAY) setPlayMode(PlayMode.STANDARD);
  }, []);


  const [darkMode, setDarkMode] = useBooleanSetting("darkMode");
  // Native views (the iOS tab bar's glass, system controls) follow the app's own
  // dark mode setting rather than the system one.
  useEffect(() => Appearance.setColorScheme(darkMode ? "dark" : "light"), [darkMode]);
  const [dragSensitivity, setSensitivity] = useNumberSetting("dragSensitivity");
  const [doubleTapDelay, setTapDelay] = useNumberSetting("doubleTapDelay");
  const [playAudio, setAudioMode] = useBooleanSetting("playAudio");

  const toggleDarkMode = () => setDarkMode(darkMode => !darkMode);
  const toggleAudioMode = () => setAudioMode(playAudio => !playAudio);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []);

  const [levels, setLevels] = useState<Level[]>([]);
  const [userLevels, setUserLevels] = useState<SharedLevel[]>([]); // We store this here so that the fetch doesn't need to be called every time the shared levels page is mounted.
  const [notificationCounts, setNotificationCounts] = useState([0, 0, 0, 0]);
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
    // TODO: Put a Toast message here? What to do if fail?
  }, [userCredential]);

  const syncLevelStateWithStorage = useRef((_uuid?: string) => { });
  const updateNotificationCounts = useRef((_index: number, _change: number) => { });

  const [playLevel, setPlayLevel] = useState<Level>(); // The level currently being played.
  const [currentGame, setGameState] = useState<Game>(); // The game state of the level being played.
  const [gameHistory, setGameHistory] = useState<Game[]>([]); // The past game states, used for undoing moves.
  const [editorLevel, setEditorLevel] = useState<UserLevel>(); // The level object being edited.
  const [playMode, setPlayMode] = useState<PlayMode>(PlayMode.STANDARD); // Different level types may require slightly different behavior.

  useEffect(() => {
    syncLevelStateWithStorage.current = (uuid?: string) => {
      if (!uuid) {
        const storedLevels = getStoredLevels();
        setLevels(storedLevels);

        // Clear the editor level only if it no longer exists (e.g. it was deleted).
        if (editorLevel && !storedLevels.some(level => level.uuid === editorLevel.uuid)) {
          setEditorLevel(undefined);
        }
        return;
      } // else if uuid is defined:

      const updatedLevel = getLevelData(uuid);
      if (!updatedLevel) return;
      setLevels(prev => prev.map(level => level.uuid === updatedLevel.uuid ? updatedLevel : level));

      // Refresh this additional state variable if necessary.
      if (uuid === editorLevel?.uuid) setEditorLevel(updatedLevel as UserLevel);
    };
  }, [levels, editorLevel]);

  useEffect(() => {
    updateNotificationCounts.current = (index: number, change: number) => {
      const newNotificationCounts = [...notificationCounts];
      if (change === 0) newNotificationCounts[index] = 0;
      else newNotificationCounts[index] += change;
      setNotificationCounts(newNotificationCounts);
    };
  }, [notificationCounts]);

  useEffect(() => {
    syncLevelStateWithStorage.current();
    checkForOfficialLevelUpdates()
      .then((numUpdated) => {
        updateNotificationCounts.current(0, numUpdated);
        syncLevelStateWithStorage.current();
      })
      // Expected when offline: keep using the locally stored levels.
      .catch((error) => console.warn("Failed to check for official level updates:", error));

    const handleSyncRequest = (uuid?: string) => syncLevelStateWithStorage.current(uuid);
    const syncListener = eventEmitter.addListener("doStateStorageSync", handleSyncRequest);

    const handleNotificationRequest = (event: any) => updateNotificationCounts.current(event.index, event.change);
    const notificationListener = eventEmitter.addListener("doNotificationsUpdate", handleNotificationRequest);

    return () => {
      syncListener.remove();
      notificationListener.remove();
    }
  }, []);

  const changePlayLevel = useCallback((uuid: string) => {
    const levelObject = getLevelData(uuid);
    if (levelObject) playLevelFromObj(levelObject);
  }, []);

  const playLevelFromObj = useCallback((level: Level) => {
    setPlayLevel(level);
    const newGame = initializeGameObj(level);
    setGameState(newGame);
    setGameHistory([]);
  }, []);

  const getNextLevel = useCallback(() => {
    // Only walk official levels (in the order the Levels page shows them): the full
    // list also holds custom levels, which "Next Level" would otherwise load in
    // STANDARD mode and then post official solution data for.
    const officialLevels = levels.filter(level => level.official);
    const nextIndex = officialLevels.findIndex(level => level.uuid === playLevel!.uuid) + 1;
    const nextLevel = nextIndex > 0 ? officialLevels[nextIndex] : undefined;
    if (nextLevel) playLevelFromObj(nextLevel);
  }, [levels, playLevel]);

  const startEditingLevel = useCallback((uuid: string) => {
    const levelObject = getLevelData(uuid);
    setEditorLevel(levelObject as UserLevel);
  }, []);

  // Declared after the state and callbacks it reads, so they can be listed as
  // dependencies (previously only [view], which left playLevel/playMode stale).
  const switchView = useCallback((newView: PageView, pageNum?: number) => {
    setScrollToBottom(false);
    if (view === PageView.PLAY && newView === PageView.EDITOR) {
      // If we are coming from PageView.PLAY, playLevel must not be undefined.
      startEditingLevel(playLevel!.uuid);
    }

    if (view === PageView.PLAY && newView === PageView.LEVELS && playMode === PlayMode.SHARED) {
      // If we were playing a shared level and are now returning to the search page, we need to clear the userLevels state to trigger a refresh on mount..
      setUserLevels([]);
    }

    if (newView < notificationCounts.length) {
      updateNotificationCounts.current(newView, 0);
    }

    if (newView === PageView.MENU) { // PAGE -> MENU
      setAnimTo(0, () => setView(newView));
    } else if (view === PageView.MENU) { // MENU -> PAGE
      openPageView(newView, pageNum);
    } else { // PAGE -> PAGE
      setAnimTo(0, () => openPageView(newView, pageNum, newView === view));
    }
  }, [view, playLevel, playMode, notificationCounts, startEditingLevel, openPageView]);

  const createNewLevel = useCallback((level: UserLevel) => {
    setEditorLevel(level);
    createLevel(level);
    const levels = getStoredLevels();
    setLevels(levels);
  }, []);

  const playSharedLevel = useCallback((level: SharedLevel | undefined) => {
    if (level) playLevelFromObj(level); // If undefined we simply resume.
    setPlayMode(PlayMode.SHARED);
  }, []);

  const beginPlaytesting = useCallback((uuid: string) => {
    changePlayLevel(uuid);
    setPlayMode(PlayMode.PLAYTEST);
  }, []);

  useEffect(() => { // TODO: update this method?
    const backAction = () => {
      if (view === PageView.PLAY || view === PageView.EDITOR) return true;
      if (view !== PageView.MENU) switchView(PageView.MENU);
      return true;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [view]);

  // This is used so that the level select component only needs to calculate
  // the level select element height one time.
  const [levelElementHeight, setElementHeight] = useState(0);

  if (!fontsLoaded) return <></>;
  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio, userCredential, userData }}>
      {/* Menu and the page panel's background extend edge-to-edge on iOS (matching
          Android); only the page contents and toasts are inset into the safe area. */}
      <View style={styles.container}>

        <Menu notificationCounts={notificationCounts} openPage={switchView} />

        <Animated.View
          style={styles.modal(pageAnim, darkMode)}
          pointerEvents={view === PageView.MENU ? "none" : "auto"}
        >
          {/* Static insets instead of a SafeAreaView: this panel is translated while it
              animates, and a SafeAreaView would re-measure mid-slide and jump. iOS only,
              like the SafeAreaView it replaces (Android pads via StatusBar.currentHeight). */}
          <View style={[styles.safeArea, Platform.OS === "ios" && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {![PageView.PLAY, PageView.EDITOR, PageView.SOLUTION].includes(view) && <View style={styles.header}>
            <Header
              pageView={view}
              returnHome={() => switchView(PageView.MENU)}
              scrollToBottom={() => {
                setScrollToBottom(false);
                setTimeout(() => setScrollToBottom(true), 100);
              }}
            />
          </View>}

          <View style={styles.page}>
            {view === PageView.LEVELS &&
              <LevelsPage
                viewCallback={switchView}
                playLevelCallback={changePlayLevel}
                playSharedLevelCb={playSharedLevel}
                scrollTo={scrollToBottom ? "last" : (!currentGame?.won ? playLevel?.uuid : undefined)}
                levels={levels.filter(lvl => lvl.official)}
                userLevels={userLevels}
                setUserLevels={setUserLevels}
                elementHeight={levelElementHeight}
                storeElementHeightCallback={setElementHeight}
              />
            }

            {view === PageView.PLAY &&
              <PlayLevel
                viewCallback={switchView}
                nextLevelCallback={getNextLevel}
                gameStateCallback={setGameState}
                gameHistoryCallback={setGameHistory}
                level={playLevel!}
                game={currentGame!}
                history={gameHistory!}
                mode={playMode}
              />
            }

            {view === PageView.MANAGE &&
              <EditorPage
                viewCallback={switchView}
                playLevelCallback={beginPlaytesting}
                startEditingCallback={startEditingLevel}
                createNewLevelCallback={createNewLevel}
                levels={levels.filter(lvl => !lvl.official && lvl.user_name === userData?.user_name)}
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

            {view === PageView.SOLUTION &&
              <ViewSolution
                viewCallback={switchView}
                level={editorLevel!} // We can only navigate to this page from the manage page, so editorLevel is guaranteed to be defined.
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
                setSensitivityCallback={setSensitivity}
                setTapDelayCallback={setTapDelay}
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

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: win.width,
  },
  // No opacity here: the header already fades with its parent modal, and a second
  // opacity on the same value made it lag the panel (effective opacity anim²).
  header: {
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: "2%",
    width: win.width,
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.2),
  },
  modal: (animState: Animated.Value, darkMode: boolean) => ({
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
        outputRange: [Platform.OS === "ios" ? win.height : win.height * 0.2, 0],
      }),
    }],
  }),
});