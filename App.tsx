import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Animated, BackHandler, SafeAreaView, StatusBar as RNStatusBar, View, StyleSheet } from "react-native";

import { getSavedSettings, parseCompressedBoardData, setData } from "./util/loader";
import { Level, PageView } from "./util/types";
import GlobalContext from "./GlobalContext";
import { colors } from "./Theme";
import { Game, initializeGameObj } from "./util/logic";

import Menu from "./components/Menu";
import AccountPage from "./pages/AccountSettings";
import LevelSelect from "./pages/LevelSelect";
import Header from "./components/Header";
import PlayLevel from "./pages/PlayLevel";
import StorePage from "./pages/StorePage";
import EditorPage from "./pages/EditorPage";
// import PlayLevel from "./pages/PlayLevel";
// import CreateLevel from "./pages/CreateLevel";

const win = Dimensions.get("window");

const rawLevels = [ // TODO: replace with fetching from firebase
  {
    uuid: "1",
    name: "Introductions",
    board: "1,1,1,1,1,1,1,1/1,0,0,4,0,0,0,5/1,7,0,4,0,0,0,5/1,0,6,4,0,0,0,5/1,1,1,1,1,1,0,1/1,0,3,0,0,0,4,1/1,0,0,0,4,0,5,1/1,0,0,0,0,6,0,1/1,5,0,4,0,0,0,1/1,5,1,1,1,1,1,1/1,0,0,5,1,0,0,0/1,0,0,4,2,0,8,0/1,0,6,0,1,0,0,0/1,1,1,1,1,1,1,1",
    completed: true,
    official: true,
  },
  {
    uuid: "2",
    name: "Easy Peasy",
    board: "1,1,1,1,1,1,1,1/1,0,0,0,4,7,0,1/1,6,1,1,5,4,0,1/1,0,0,0,4,5,4,1/1,0,4,0,6,4,0,1/1,3,1,0,0,4,5,1/1,1,1,1,1,1,2,1/1,0,0,0,0,1,0,1/1,0,8,0,0,12.3,0,1/1,0,0,0,0,12.3,0,1/1,1,1,1,12.0,0,4,1/1,0,6,5,0,4,0,1/1,0,0,0,4,0,0,1/1,1,1,1,1,1,1,1",
    completed: true,
    official: true,
  },
  {
    uuid: "3",
    name: "Having a Blast",
    board: "1,1,1,1,1,1,1,1/0,0,1,0,0,5,4,5/0,0,2,4,7,9.25,5,0/6,0,1,0,12.0,0,0,0/0,0,1,5,0,0,0,4/4,0,1,0,4,0,0,5/0,4,1,0,0,0,4,1/0,0,1,1,4,4,4,1/0,0,5,1,4,6,3,1/0,0,0,1,1,12.0,12.0,1/0,0,0,5,6,0,0,1/0,0,4,1,0,8,0,1/5,4,5,1,0,0,0,1/1,1,1,1,1,1,1,1",
    completed: false,
    official: true,
  },
  {
    uuid: "4",
    name: "Rooms",
    board: "0,0,2,0,1,1,1,3/0,0,1,0,1,0,0,5/4,4,1,0,2,0,4,0/5,5,1,0,1,6,0,4/4,0,1,0,1,1,1,1/0,0,1,0,1,4,4,0/8,1,0,4,5,1,1,0/1,1,5,7,0,1,1,5/1,3,4,4,4,0,1,1/1,1,0,0,0,0,1,1/1,1,4,4,0,0,1,6/0,0,0,0,4,5,1,5/1,1,1,1,2,1,1,4/1,1,1,3,0,0,0,0",
    completed: false,
    official: true,
  },
  {
    uuid: "5",
    name: "Choices",
    board: "0,0,0,6,1,0,0,0/0,4,0,1,0,0,3,5/4,0,4,1,0,4,4,0/0,4,0,1,0,4,5,0/0,6,0,1,4,4,0,0/0,0,0,2,0,0,0,5/1,1,1,1,0,0,1,0/0,0,6,5,4,1,0,0/1,1,0,4,7,4,0,0/0,0,0,0,4,0,0,0/0,0,0,1,0,1,0,0/0,0,0,1,8,1,5,4/4,4,0,0,1,0,0,6/6,0,5,0,0,0,0,0",
    completed: false,
    official: true,
  },
  {
    uuid: "6",
    name: "Running Laps",
    board: "0,0,0,1,0,1,1,0/0,7,0,0,4,0,8,0/0,0,0,1,0,0,1,5/0,0,0,1,3,0,1,1/0,4,4,1,5,1,4,4/0,4,0,1,0,0,0,4/4,0,0,1,0,6,0,0/1,0,1,1,0,0,5,0/0,0,0,0,0,5,4,0/0,0,0,0,0,0,0,0/1,2,1,0,6,0,0,0/0,0,5,0,0,1,1,4/0,6,5,0,0,1,6,0/6,0,1,0,0,4,0,0",
    completed: false,
    official: true,
  },
  {
    uuid: "7",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
    completed: false,
    official: true,
  },
  {
    uuid: "1",
    name: "Custom Introductions",
    board: "1,1,1,1,1,1,1,1/1,0,0,4,0,0,0,5/1,7,0,4,0,0,0,5/1,0,6,4,0,0,0,5/1,1,1,1,1,1,0,1/1,0,3,0,0,0,4,1/1,0,0,0,4,0,5,1/1,0,0,0,0,6,0,1/1,5,0,4,0,0,0,1/1,5,1,1,1,1,1,1/1,0,0,5,1,0,0,0/1,0,0,4,2,0,8,0/1,0,6,0,1,0,0,0/1,1,1,1,1,1,1,1",
    completed: true,
    official: false,
    designer: "hello",
  },
  {
    uuid: "2",
    name: "Custom Easy Peasy",
    board: "1,1,1,1,1,1,1,1/1,0,0,0,4,7,0,1/1,6,1,1,5,4,0,1/1,0,0,0,4,5,4,1/1,0,4,0,6,4,0,1/1,3,1,0,0,4,5,1/1,1,1,1,1,1,2,1/1,0,0,0,0,1,0,1/1,0,8,0,0,12.3,0,1/1,0,0,0,0,12.3,0,1/1,1,1,1,12.0,0,4,1/1,0,6,5,0,4,0,1/1,0,0,0,4,0,0,1/1,1,1,1,1,1,1,1",
    completed: true,
    official: false,
    designer: "hello",
  },
  {
    uuid: "3",
    name: "Custom Having a Blast",
    board: "1,1,1,1,1,1,1,1/0,0,1,0,0,5,4,5/0,0,2,4,7,9.25,5,0/6,0,1,0,12.0,0,0,0/0,0,1,5,0,0,0,4/4,0,1,0,4,0,0,5/0,4,1,0,0,0,4,1/0,0,1,1,4,4,4,1/0,0,5,1,4,6,3,1/0,0,0,1,1,12.0,12.0,1/0,0,0,5,6,0,0,1/0,0,4,1,0,8,0,1/5,4,5,1,0,0,0,1/1,1,1,1,1,1,1,1",
    completed: false,
    official: false,
    designer: "hello",
  },
  {
    uuid: "4",
    name: "Custom Rooms",
    board: "0,0,2,0,1,1,1,3/0,0,1,0,1,0,0,5/4,4,1,0,2,0,4,0/5,5,1,0,1,6,0,4/4,0,1,0,1,1,1,1/0,0,1,0,1,4,4,0/8,1,0,4,5,1,1,0/1,1,5,7,0,1,1,5/1,3,4,4,4,0,1,1/1,1,0,0,0,0,1,1/1,1,4,4,0,0,1,6/0,0,0,0,4,5,1,5/1,1,1,1,2,1,1,4/1,1,1,3,0,0,0,0",
    completed: false,
    official: false,
    designer: "hello",
  },
  {
    uuid: "5",
    name: "Custom Choices",
    board: "0,0,0,6,1,0,0,0/0,4,0,1,0,0,3,5/4,0,4,1,0,4,4,0/0,4,0,1,0,4,5,0/0,6,0,1,4,4,0,0/0,0,0,2,0,0,0,5/1,1,1,1,0,0,1,0/0,0,6,5,4,1,0,0/1,1,0,4,7,4,0,0/0,0,0,0,4,0,0,0/0,0,0,1,0,1,0,0/0,0,0,1,8,1,5,4/4,4,0,0,1,0,0,6/6,0,5,0,0,0,0,0",
    completed: false,
    official: false,
    designer: "hello",
  },
  {
    uuid: "6",
    name: "Custom Running Laps",
    board: "0,0,0,1,0,1,1,0/0,7,0,0,4,0,8,0/0,0,0,1,0,0,1,5/0,0,0,1,3,0,1,1/0,4,4,1,5,1,4,4/0,4,0,1,0,0,0,4/4,0,0,1,0,6,0,0/1,0,1,1,0,0,5,0/0,0,0,0,0,5,4,0/0,0,0,0,0,0,0,0/1,2,1,0,6,0,0,0/0,0,5,0,0,1,1,4/0,6,5,0,0,1,6,0/6,0,1,0,0,4,0,0",
    completed: false,
    official: false,
    designer: "hello",
  },
  {
    uuid: "7",
    name: "Custom Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
    completed: false,
    official: false,
    designer: "hello",
  },
];

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
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(pageAnim, {
      toValue: animState,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  const [view, setView] = useState(PageView.MENU);
  const switchView = useCallback((newView: PageView) => {
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
  useEffect(() => {
    const newLevels: Level[] = [];
    rawLevels.forEach(rawLevel => {
      newLevels.push({
        uuid: rawLevel.uuid,
        name: rawLevel.name,
        board: parseCompressedBoardData(rawLevel.board),
        official: rawLevel.official,
        completed: rawLevel.completed,
        designer: "hello",
      });
    });
    setLevels(newLevels);
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

  async function readSettingsFromStorage() {
    const settings = await getSavedSettings();

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

  const [playLevel, setPlayLevel] = useState<number>(-1);  // Stores the index of level currently being played.
  const [currentGame, setGameState] = useState<Game>();    // Stores the game state of the level being played.
  const [editorLevel, setEditorLevel] = useState<Level>(); // Stores the level object being edited.

  const changePlayLevel = useCallback((index: number) => {
    setPlayLevel(index);
    const newGame = initializeGameObj(levels[index]);
    setGameState(newGame);
  }, [levels]);

  const getNextLevel = useCallback(() => {
    const nextIndex = levels.findIndex(level => level.uuid = levels[playLevel].uuid);
    const nextLevel = levels[nextIndex + 1];

    if (nextLevel) {
      setPlayLevel(nextIndex);
      setGameState(initializeGameObj(nextLevel));
    }
  }, [levels]);

  useEffect(() => { // TODO: update this method?
    const backAction = () => {
      if (view !== PageView.MENU) {
        switchView(PageView.MENU);
      }
      return true;
    }

    // const backAction = () => view !== PageView.MENU;
    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [view]);

  // This is used so that the level select component only needs to calculate
  // the level select element height one time.
  const [levelElementHeight, setElementHeight] = useState(0);

  if (!fontsLoaded) return <></>;
  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio, levels }}>
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
                // editorLevelCallback={setEditorLevel}
                levels={levels.filter(level => level.official)}
                playLevel={!currentGame?.won ? playLevel : -1}
                // editorLevel={editorLevel?.uuid}
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
              level={levels[playLevel]}
              game={currentGame!}
              playtest={false}
              />
            }

            {view === PageView.EDIT &&
              <EditorPage>
                <LevelSelect
                  viewCallback={switchView}
                  playLevelCallback={changePlayLevel}
                  editorLevelCallback={setEditorLevel}
                  levels={levels.filter(level => !level.official)} // TODO: and level.designer === the current user
                  playLevel={!currentGame?.won ? playLevel : -1}
                  // editorLevel={editorLevel?.uuid}
                  elementHeight={levelElementHeight}
                  storeElementHeightCallback={setElementHeight}
                  mode={PageView.EDIT}
                />
              </EditorPage>
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
    borderColor: colors.LIGHT_GRAY,
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