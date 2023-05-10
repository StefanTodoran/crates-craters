import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated, BackHandler, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';

import { colors, graphics, nextTheme } from './Theme';
import { GlobalContext } from './GlobalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomePage from './pages/HomePage';
import IconButton from './components/IconButton';
import LevelSelect from './pages/LevelSelect';
import PlayLevel from './pages/PlayLevel';
import CreateLevel from './pages/CreateLevel';
import { cloneLevelObj, storeData } from './Game';

const win = Dimensions.get('window');

/**
 * App is the main entry point into the application. App contains global state,
 * such as the level in progress, the current page, and settings such as dark mode.
 * App handles the transition between different pages, the loading of settings from
 * storage, and the providing of these settings via a context. 
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': require('./assets/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('./assets/Montserrat-Medium.ttf'),
  });

  const pageAnim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState, callback) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(pageAnim, {
      toValue: animState,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  const [view, setView] = useState("home");
  const switchView = useCallback((newView) => {
    if (newView === "home") {
      setAnimTo(0, () => {
        setView(newView);
      });
    } else {
      setView(newView);
      setAnimTo(1);
    }
  }, []);

  // Like the getData function in Game.js but with a fallback value.
  async function getData(storageKey, expectedType, defaultValue) {
    try {
      const jsonValue = await AsyncStorage.getItem(storageKey);
      const value = jsonValue != null ? JSON.parse(jsonValue) : null;

      if (typeof value === expectedType) {
        return value;
      } else {
        return defaultValue;
      }
    } catch (err) {
      console.log("\n\n(ERROR) >>> READING ERROR:\n", err);
      return false;
    }
  }

  // We can't just await data from storage to set the default app state values,
  // so we will have to just put some default dummy values below and run the
  // update function to replace those values as soon as possible.

  const [darkMode, setDarkMode] = useState(false);
  const [dragSensitivity, setSensitivity] = useState(60);
  const [doubleTapDelay, setTapDelay] = useState(250);
  const [curTheme, setCurTheme] = useState("purple");
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

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(!darkMode ? "white" : colors.NEAR_BLACK);
  }, [darkMode, curTheme]);

  // We use this to avoid rewriting the settings on app start (since
  // the setting writing useEffect will trigger on first render).
  const didReadSettings = useRef(false);

  async function readSettingsFromStorage() {
    const storedDarkMode = await getData("isAppDarkMode", "boolean", false);
    setDarkMode(storedDarkMode);

    const storedAudioMode = await getData("appAudioMode", "boolean", true);
    setAudioMode(storedAudioMode);

    setSensitivity(await getData("appDragSensitivity", "number", 60));
    setTapDelay(await getData("appDoubleTapDelay", "number", 250));

    // At the moment there is only one theme, uncomment and
    // fix this funciton when that changes.

    // let theme = "main"; // by default, Theme.js exports main theme
    // const targetTheme = await getData("appTheme", "string", "main");
    // while (theme !== targetTheme) {
    //   theme = nextTheme();
    // }
    // setCurTheme(theme);
    didReadSettings.current = true;
  }

  // Any time an option holding some setting's state is updated,
  // we should write this to storage so it remains the same next startup.
  useEffect(() => {
    if (didReadSettings.current) {
      storeData(darkMode, "isAppDarkMode");
      storeData(playAudio, "appAudioMode");
      storeData(dragSensitivity, "appDragSensitivity");
      storeData(doubleTapDelay, "appDoubleTapDelay");
      storeData(curTheme, "appTheme");
    }
  }, [darkMode, playAudio, dragSensitivity, doubleTapDelay, curTheme]);

  useEffect(() => {
    readSettingsFromStorage();
  }, []);

  const [playLevel, setPlayLevel] = useState(1); // Stores the level number to be played / being played.
  const [game, setGameState] = useState(null); // Stores the game state of the level being played.
  const [editorLevel, setEditorLevel] = useState(-1); // Stores the level number to be edited / being edited.
  const [editorLevelObj, setEditorLevelObj] = useState(-1); // Stores the level object being edited.

  const changePlayLevel = useCallback((lvl) => {
    setPlayLevel(lvl);
    setGameState(null);
  }, []);
  const changeEditorLevel = useCallback((lvl) => {
    setEditorLevel(lvl);
    setEditorLevelObj(cloneLevelObj(lvl));
  }, []);

  useEffect(() => { // TODO: update this method?
    const backAction = () => {
      return view !== "home";
    }
    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [view]);

  // This is used so that the level select component only needs to calculate
  // the level select element height one time.
  const [levelElementHeight, setElementHeight] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white" }}>

        {/* HEADER BANNER */}
        <Animated.View style={styles.header(pageAnim)}>
          <Image style={styles.banner} source={graphics.TITLE_BANNER} />

          <View style={styles.menuButton}>
            <IconButton onPress={() => { switchView("settings") }} />
          </View>
        </Animated.View>

        {/* HOME VIEW */}
        {view === "home" &&
          <View style={[styles.page, { paddingHorizontal: 0 }]}>
            <LevelSelect
              viewCallback={switchView}
              playLevelCallback={changePlayLevel}
              editorLevelCallback={changeEditorLevel}
              playLevel={playLevel} editorLevel={editorLevel} game={game}
              elementHeight={levelElementHeight} storeElementHeightCallback={setElementHeight}
            />
          </View>
        }

        {/* SETTINGS VIEW */}
        {view === "settings" &&
          <Animated.View style={[styles.modal(pageAnim, darkMode), styles.page]}>
            <HomePage
              viewCallback={switchView}
              darkModeCallback={toggleDarkMode}
              setThemeCallback={setCurTheme}
              audioModeCallback={toggleAudioMode}
              setSensitivityCallback={setSensitivity}
              setTapDelayCallback={setTapDelay}
            />
          </Animated.View>
        }

        {/* GAMEPLAY VIEW */}
        {view === "play" &&
          <Animated.View style={styles.modal(pageAnim, darkMode)}>
            <PlayLevel
              viewCallback={switchView}
              level={playLevel} levelCallback={changePlayLevel}
              game={game} gameStateCallback={setGameState}
            />
          </Animated.View>
        }

        {/* EDIT VIEW */}
        {view === "edit" &&
          <Animated.View style={styles.modal(pageAnim, darkMode)}>
            <CreateLevel
              viewCallback={switchView}
              playLevelCallback={changePlayLevel}
              editorLevelCallback={changeEditorLevel}
              storeLevelCallback={setEditorLevelObj}
              levelIndex={editorLevel} levelObj={editorLevelObj}
              playTestCallback={() => { }}
            />
          </Animated.View>
        }

      </SafeAreaView>
      <StatusBar style={darkMode ? "light" : "dark"} />
    </GlobalContext.Provider>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
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
  header: (anim) => ({
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: "2%",
    width: win.width,
    zIndex: 1,
    borderBottomWidth: 1,
    borderColor: colors.MAIN_PURPLE_TRANSPARENT(0.3),
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -100],
      }),
    }],
  }),
  modal: (animState, darkMode) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    opacity: animState,
  }),
  menuButton: {
    position: "absolute",
    top: RNStatusBar.currentHeight + (win.width * 0.02),
    right: "3%",
  },
});
