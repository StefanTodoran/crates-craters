import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Animated, BackHandler, SafeAreaView, StatusBar as RNStatusBar } from "react-native";

import { getSavedSettings, parseCompressedBoardData, setData } from "./util/loader";
import { Level, PageView } from "./util/types";
import GlobalContext from "./GlobalContext";
import { colors } from "./Theme";
import { Game } from "./util/logic";

import Menu from "./components/Menu";
import HomePage from "./pages/HomePage";
import LevelSelect from "./pages/LevelSelect";
// import PlayLevel from "./pages/PlayLevel";
// import CreateLevel from "./pages/CreateLevel";

const win = Dimensions.get("window");

const rawLevels = [ // TODO: replace with fetching from firebase
  {
    uuid: "1",
    name: "Introductions",
    board: "1,1,1,1,1,1,1,1/1,0,0,4,0,0,0,5/1,7,0,4,0,0,0,5/1,0,6,4,0,0,0,5/1,1,1,1,1,1,0,1/1,0,3,0,0,0,4,1/1,0,0,0,4,0,5,1/1,0,0,0,0,6,0,1/1,5,0,4,0,0,0,1/1,5,1,1,1,1,1,1/1,0,0,5,1,0,0,0/1,0,0,4,2,0,8,0/1,0,6,0,1,0,0,0/1,1,1,1,1,1,1,1",
  },
  {
    uuid: "2",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
  },
  {
    uuid: "3",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
  },
  {
    uuid: "4",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
  },
  {
    uuid: "5",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
  },
  {
    uuid: "6",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
  },
  {
    uuid: "7",
    name: "Warzone",
    board: "5,4,5,5,0,4,0,12.3/4,1,6,5,1,12.0,4,5/5,3,5,0,1,6,12.1,0/4,4,0,0,0,4,1,4/0,1,5,0,12.0,0,1,6/6,8,5,9.25,5,2,9.75,5/2,5,1,12.0,1,0,4,0/0,0,4,7,5,12.3,9.5,4/5,4,0,4,3,9.50,2,4/1,5,0,0,12.0,0,12.0,12.3/6,4,1,12.2,4,0,1,12.0/3,0,4,0,4,0,1,6/4,5,4,4,5,0,5,4/5,4,9.10,4,0,5,0,4",
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
    if (newView === PageView.MENU) {
      setAnimTo(0, () => {
        setView(newView);
      });
    } else {
      setView(newView);
      setAnimTo(1);
    }
  }, []);

  const [levels, setLevels] = useState<Level[]>([]);
  useEffect(() => {
    const newLevels: Level[] = [];
    rawLevels.forEach(rawLevel => {
      newLevels.push({
        uuid: rawLevel.uuid,
        name: rawLevel.name,
        board: parseCompressedBoardData(rawLevel.board),
        official: true,
        completed: false,
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

  const [currentGame, setGameState] = useState<Game>(); // Stores the game state of the level being played.
  const [editorLevel, setEditorLevel] = useState<Level>(); // Stores the level object being edited.

  // const changePlayLevel = useCallback((lvl: number) => {
  //   setPlayLevel(lvl);
  //   setGameState(null);
  // }, []);
  // const changeEditorLevel = useCallback((lvl: number) => {
  //   setEditorLevel(lvl);
  //   setEditorLevel(cloneLevelObj(lvl));
  // }, []);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white" }}>

        <Menu openPage={switchView} />

        <Animated.View
          style={[styles.modal(pageAnim, darkMode), styles.page]}
          pointerEvents={view === PageView.MENU ? "none" : "auto"}
        >
          {view === PageView.LEVELS &&
            <LevelSelect
              viewCallback={switchView}
              // playLevelCallback={changePlayLevel}
              // editorLevelCallback={changeEditorLevel}
              playLevel={currentGame?.uuid}
              editorLevel={editorLevel?.uuid}
              elementHeight={levelElementHeight}
              storeElementHeightCallback={setElementHeight}
            />
          }
          {view === PageView.ACCOUNT &&
            <HomePage
              viewCallback={switchView}
              darkModeCallback={toggleDarkMode}
              audioModeCallback={toggleAudioMode}
              setSensitivityCallback={setSensitivity}
              setTapDelayCallback={setTapDelay}
            />
          }
        </Animated.View>

      </SafeAreaView>
      <StatusBar translucent={true} />
    </GlobalContext.Provider>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent: any, height: number, width: number) {
  const ratio = win.width * percent / width;
  return [win.width * percent, ratio * height];
}

const styles: any = {
  banner: {
    width: sizeFromWidthPercent(0.9, 141, 681)[0],
    height: sizeFromWidthPercent(0.9, 141, 681)[1],
  },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: win.width,
    paddingHorizontal: win.width * 0.225,
  },
  header: (animState: any) => ({
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: "2%",
    width: win.width,
    zIndex: 1,
    borderBottomWidth: 1,
    borderColor: colors.MAIN_PURPLE_TRANSPARENT(0.3),
    opacity: animState.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [{
      translateY: animState.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
      }),
    }],
  }),
  modal: (animState: any, darkMode: any) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: RNStatusBar.currentHeight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
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
  menuButton: {
    position: "absolute",
    top: RNStatusBar.currentHeight! + (win.width * 0.02),
    right: "3%",
  },
};