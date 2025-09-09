import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { UserCredential, signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Dimensions, StatusBar as RNStatusBar, SafeAreaView, StyleSheet, View } from "react-native";
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
import { doPageChange, eventEmitter } from "./util/events";
import { auth } from "./util/firebase";
import { useBooleanSetting, useNumberSetting } from "./util/hooks";
import { createLevel, getData, getLevelData, getStoredLevels, metadataKeys, setData } from "./util/loader";
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
export default function App() {
  const [fontsLoaded] = useFonts({
    "Montserrat-Regular": require("./assets/Montserrat-Regular.ttf"),
    "Montserrat-Medium": require("./assets/Montserrat-Medium.ttf"),
  });

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

  const openPageView = useCallback((newView: PageView, pageNum?: number) => {
    setView(newView);
    setAnimTo(1, () => {
      if (pageNum !== undefined) doPageChange(pageNum);
    });

    // Non-standard play modes are set when calling App.tsx to 
    // begin play, and therefore should be cleared when play is left.
    if (newView !== PageView.PLAY) setPlayMode(PlayMode.STANDARD);
  }, []);

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
      setAnimTo(0, () => openPageView(newView, pageNum));
    }
  }, [view]);

  const [darkMode, setDarkMode] = useBooleanSetting("darkMode");
  const [dragSensitivity, setSensitivity] = useNumberSetting("dragSensitivity");
  const [doubleTapDelay, setTapDelay] = useNumberSetting("doubleTapDelay");
  const [playAudio, setAudioMode] = useBooleanSetting("playAudio");

  const toggleDarkMode = () => setDarkMode(darkMode => !darkMode);
  const toggleAudioMode = () => setAudioMode(playAudio => !playAudio);

  useEffect(() => {
    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBehaviorAsync("overlay-swipe");
    NavigationBar.setBackgroundColorAsync("transparent");
  }, []);

  const [levels, setLevels] = useState<Level[]>([]);
  const [userLevels, setUserLevels] = useState<SharedLevel[]>([]); // We store this here so that the fetch doesn't need to be called every time the shared levels page is mounted.
  const [notificationCounts, setNotificationCounts] = useState([0, 0, 0, 0]);
  const [userCredential, setUserCredential] = useState<UserCredential>();
  const [userData, setUserData] = useState<UserAccountDocument>();

  const attemptSignIn = useCallback(async () => {
    // Grab the saved email and password from storage.
    const savedCredentials = getData(metadataKeys.userCredentials);
    if (!savedCredentials) return;

    signInWithEmailAndPassword(auth, savedCredentials.email, savedCredentials.password)
      .then((userCredential) => setUserCredential(userCredential))
      .catch((error) => {
        console.error("Failed to sign in with saved credentials:", error.code);
        if (error.code === "auth/invalid-credential") setData(metadataKeys.userCredentials, undefined);
      });
    return;
  }, []);

  useEffect(() => {
    if (!userCredential) {
      attemptSignIn();
      return;
    }

    getUserData(userCredential.user.email!).then((data) => setUserData(data));
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
        setLevels(getStoredLevels());

        const editorLevelIndex = levels.findIndex(level => level.uuid === editorLevel?.uuid);
        if (editorLevelIndex !== -1) setEditorLevel(undefined);
        return;
      } // else if uuid is defined:

      const updatedLevel = getLevelData(uuid);
      const levelIndex = levels.findIndex(level => level.uuid === updatedLevel.uuid);
      levels[levelIndex] = updatedLevel;

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
    checkForOfficialLevelUpdates().then((numUpdated) => {
      updateNotificationCounts.current(0, numUpdated);
      syncLevelStateWithStorage.current();
    });

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
    playLevelFromObj(levelObject);
  }, []);

  const playLevelFromObj = useCallback((level: Level) => {
    setPlayLevel(level);
    const newGame = initializeGameObj(level);
    setGameState(newGame);
    setGameHistory([]);
  }, []);

  const getNextLevel = useCallback(() => {
    const nextIndex = levels.findIndex(level => level.uuid === playLevel!.uuid) + 1;
    const nextLevel = levels[nextIndex];
    if (nextLevel) playLevelFromObj(nextLevel);
  }, [levels, playLevel]);

  const startEditingLevel = useCallback((uuid: string) => {
    const levelObject = getLevelData(uuid);
    setEditorLevel(levelObject as UserLevel);
  }, []);

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
      <SafeAreaView style={styles.container}>

        <Menu notificationCounts={notificationCounts} openPage={switchView} />

        <Animated.View
          style={styles.modal(pageAnim, darkMode)}
          pointerEvents={view === PageView.MENU ? "none" : "auto"}
        >
          {![PageView.PLAY, PageView.EDITOR, PageView.SOLUTION].includes(view) && <Animated.View style={styles.header(pageAnim)}>
            <Header
              pageView={view}
              returnHome={() => switchView(PageView.MENU)}
              scrollToBottom={() => {
                setScrollToBottom(false);
                setTimeout(() => setScrollToBottom(true), 100);
              }}
            />
          </Animated.View>}

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
        </Animated.View>

        <Toast
          position="top"
          bottomOffset={20}
          config={toastConfig}
        />
      </SafeAreaView>

      <StatusBar translucent={true} hidden={true} />
    </GlobalContext.Provider>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: win.width,
  },
  header: (animState: Animated.Value) => ({
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: "2%",
    width: win.width,
    borderBottomWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.2),
    opacity: animState,
  }),
  modal: (animState: Animated.Value, darkMode: boolean) => ({
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkMode ? "black" : "white",
    opacity: animState,
    borderRadius: animState.interpolate({
      inputRange: [0, 0.75, 1],
      outputRange: [40, 30, 0],
    }),
    transform: [{
      translateY: animState.interpolate({
        inputRange: [0, 1],
        outputRange: [win.height * 0.2, 0],
      }),
    }],
  }),
});