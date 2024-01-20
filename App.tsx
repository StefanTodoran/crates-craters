import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Animated, BackHandler, SafeAreaView, StatusBar as RNStatusBar, View, StyleSheet } from "react-native";

import { createLevel, getData, getSavedSettings, getStoredLevels, setData, updateLevel } from "./util/loader";
import { checkForOfficialLevelUpdates } from "./util/database";
import { Level, PageView, UserLevel } from "./util/types";
import { Game, initializeGameObj } from "./util/logic";
import { eventEmitter } from "./util/events";
import GlobalContext from "./GlobalContext";
import { colors } from "./Theme";

import Menu from "./components/Menu";
import Header from "./components/Header";
import AccountPage from "./pages/AccountSettings";
import LevelSelect from "./pages/LevelSelect";
import EditorPage from "./pages/EditorPage";
import PlayLevel from "./pages/PlayLevel";
import StorePage from "./pages/StorePage";
import EditLevel from "./pages/EditLevel";

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
  const switchView = useCallback((newView: PageView) => {
    // To playtest a level, the child component must call beginPlaytesting(),
    // which will change the view to the play view. Therefore we need to clear
    // it for the child once the user leaves the play view.
    if (newView !== PageView.PLAY) setPlaytesting(false);

    if (newView === PageView.MENU) { // PAGE -> MENU
      setAnimTo(0, () => setView(newView));
    } else if (view === PageView.MENU) {// MENU -> PAGE
      setView(newView);
      setAnimTo(1);
    } else { // PAGE -> PAGE
      setAnimTo(0, () => {
        setView(newView);
        setAnimTo(1);
      });
    }
  }, [view]);
  
  const [levels, setLevels] = useState<Level[]>([]);
  const syncLevelStateWithStorage = useRef((_uuid?: string) => {});

  useEffect(() => {
    syncLevelStateWithStorage.current = (uuid?: string) => {
      if (uuid) {
        console.log(`Syncing level ${uuid} with MMKV storage.`);
        const updatedLevel = getData(uuid);
        const levelIndex = levels.findIndex(level => level.uuid === updatedLevel.uuid);
        levels[levelIndex] = updatedLevel;
      } else {
        console.log("Syncing level state with MMKV storage.");
        setLevels(getStoredLevels());
      }
    }
  }, [levels, setLevels]);

  useEffect(() => {
    checkForOfficialLevelUpdates().then(() => syncLevelStateWithStorage.current());
    
    const handleSyncRequest = (event: CustomEvent) => syncLevelStateWithStorage.current(event?.detail);
    const listener = eventEmitter.addListener("doStateStorageSync", handleSyncRequest);
    return () => listener.remove();
  }, []);

  // We can't just await data from storage to set the default app state values,
  // so we will have to just put some default dummy values below and run the
  // update function to replace those values as soon as possible.

  const [darkMode, setDarkMode] = useState(false);
  const [dragSensitivity, setSensitivity] = useState(60);
  const [doubleTapDelay, setTapDelay] = useState(250);
  const [playAudio, setAudioMode] = useState(true);

  // These functions are used by children (probably only the settings page)
  // to modify App's state, and we use them to abstract that away from those
  // components and because we have the state and AyncStorage here.

  const toggleDarkMode = () => {
    setDarkMode(current => !current);
  }
  const toggleAudioMode = () => {
    setAudioMode(current => !current);
  }

  // We use this to avoid rewriting the settings on app start (since
  // the setting writing useEffect will trigger on first render).
  const didReadSettings = useRef(false);

  function readSettingsFromStorage() {
    const settings = getSavedSettings();

    setDarkMode(settings.darkMode);
    setAudioMode(settings.playAudio);
    setSensitivity(settings.dragSensitivity);
    setTapDelay(settings.doubleTapDelay);

    didReadSettings.current = true;
  }

  // Any time an option holding some setting's state is updated,
  // we should write this to storage so it remains the same next startup.
  useEffect(() => {
    if (didReadSettings.current) {
      setData("isAppDarkMode", darkMode);
      setData("appAudioMode", playAudio);
      setData("appDragSensitivity", dragSensitivity);
      setData("appDoubleTapDelay", doubleTapDelay);
    }
  }, [darkMode, playAudio, dragSensitivity, doubleTapDelay]);

  useEffect(() => {
    readSettingsFromStorage();
  }, []);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(darkMode ? "#000" : "#fff");
  }, [darkMode]);

  const [playLevel, setPlayLevel] = useState<Level>();             // The level currently being played.
  const [currentGame, setGameState] = useState<Game>();            // The game state of the level being played.
  const [gameHistory, setGameHistory] = useState<Game[]>();        // The past game states, used for undoing moves.
  const [editorLevel, setEditorLevel] = useState<UserLevel>();     // The level object being edited.
  const [playtesting, setPlaytesting] = useState<boolean>(false);  // Whether playtestingmode is requested.

  const changePlayLevel = useCallback((uuid: string) => {
    const levelObject = getData(uuid);
    setPlayLevel(levelObject);

    const newGame = initializeGameObj(levelObject);
    setGameState(newGame);
    setGameHistory([]);
  }, []);

  const getNextLevel = useCallback(() => {
    const nextIndex = levels.findIndex(level => level.uuid === playLevel!.uuid) + 1;
    const nextLevel = levels[nextIndex];

    if (nextLevel) {
      setPlayLevel(nextLevel);
      setGameState(initializeGameObj(nextLevel));
      setGameHistory([]);
    }
  }, [levels, playLevel]);

  const startEditingLevel = useCallback((uuid: string) => {
    const levelObject = getData(uuid);
    setEditorLevel(levelObject);
  }, []);

  const createNewLevel = useCallback((level: UserLevel) => {
    setEditorLevel(level);
    createLevel(level);
    
    const levels = getStoredLevels();
    setLevels(levels);
  }, []);

  const beginPlaytesting = useCallback((uuid: string) => {
    changePlayLevel(uuid);
    setPlaytesting(true);
    switchView(PageView.PLAY);
  }, []);

  useEffect(() => { // TODO: update this method?
    const backAction = () => {
      if (view !== PageView.MENU) {
        switchView(PageView.MENU);
      }
      return true;
    }

    BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [view]);

  // This is used so that the level select component only needs to calculate
  // the level select element height one time.
  const [levelElementHeight, setElementHeight] = useState(0);

  if (!fontsLoaded) return <></>;
  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio }}>
      <SafeAreaView style={{ flex: 1 }}>

        <Menu openPage={switchView} />

        <Animated.View
          style={styles.modal(pageAnim, darkMode)}
          pointerEvents={view === PageView.MENU ? "none" : "auto"}
        >
          {![PageView.PLAY, PageView.EDITOR].includes(view) && <Animated.View style={styles.header(pageAnim)}>
            <Header pageView={view} returnHome={() => switchView(PageView.MENU)} />
          </Animated.View>}

          <View style={styles.page}>
            {view === PageView.LEVELS &&
              <LevelSelect
                viewCallback={switchView}
                playLevelCallback={changePlayLevel}
                // editorLevelCallback={startEditingLevel}
                levels={levels.filter(ref => ref.official)}
                scrollTo={!currentGame?.won ? playLevel?.uuid : undefined}
                elementHeight={levelElementHeight}
                storeElementHeightCallback={setElementHeight}
                mode={PageView.LEVELS}
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
                playtest={playtesting}
              />
            }

            {view === PageView.EDIT &&
              <EditorPage
                viewCallback={switchView}
                playLevelCallback={beginPlaytesting}
                startEditingCallback={startEditingLevel}
                createNewLevelCallback={createNewLevel}
                levels={levels.filter(ref => !ref.official)} // TODO: and level.designer === the current user
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
                playtestLevel={() => beginPlaytesting(editorLevel!.uuid)}
                storeChanges={updateLevel}
              />
            }

            {view === PageView.STORE &&
              <StorePage />
            }

            {view === PageView.SETTINGS &&
              <AccountPage
                darkModeCallback={toggleDarkMode}
                audioModeCallback={toggleAudioMode}
                setSensitivityCallback={setSensitivity}
                setTapDelayCallback={setTapDelay}
              />
            }
          </View>
        </Animated.View>

      </SafeAreaView>
      <StatusBar translucent={true} hidden={true} />
    </GlobalContext.Provider>
  );
}

const styles = StyleSheet.create<any>({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: win.width,
    // paddingHorizontal: win.width * 0.225,
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
    // transform: [{
    //   translateY: animState.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: [-500, 0],
    //   }),
    // }],
  }),
  modal: (animState: Animated.Value, darkMode: boolean) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // paddingTop: RNStatusBar.currentHeight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: darkMode ? "black" : "white",
    opacity: animState,
    borderRadius: animState.interpolate({
      inputRange: [0, 0.75, 1],
      outputRange: [50, 40, 0],
    }),
    transform: [{
      translateY: animState.interpolate({
        inputRange: [0, 1],
        outputRange: [win.height * 0.2, 0],
      }),
    }],
  }),
});