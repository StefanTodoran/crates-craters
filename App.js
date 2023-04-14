import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated, BackHandler, ScrollView, SafeAreaView, StatusBar as RNStatusBar } from 'react-native';

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

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': require('./assets/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('./assets/Montserrat-Medium.ttf'),
  });

  // Page state is used so that the navbar icons can reflect
  // the horizontal scrollview position, and for jumping to page.
  const [page, setPageState] = useState(0);
  const scrollRef = useRef();

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState, callback) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
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

    let theme = "purple"; // by default, Theme.js exports purple theme
    const targetTheme = await getData("appTheme", "string", "purple");
    while (theme !== targetTheme) {
      theme = nextTheme();
    }
    setCurTheme(theme);
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
  const [editorLevel, setEditorLevel] = useState(null); // Stores the level number to be edited / being edited.
  const [editorLevelObj, setEditorLevelObj] = useState(null); // Stores the level object being edited.

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white" }}>
        {/* HEADER BANNER */}
        <Animated.View style={styles.header(anim)}>
          <Image style={styles.banner} source={graphics.TITLE_BANNER} />
        </Animated.View>

        {/* HOME VIEW */}
        {view === "home" && <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(evt) => {
          setPageState(Math.round(evt.nativeEvent.contentOffset.x / win.width));
        }} ref={scrollRef} overScrollMode="never">

          {/* LEVEL SELECT */}
          <View style={styles.page}>
            <LevelSelect viewCallback={switchView} playLevelCallback={changePlayLevel} editorLevelCallback={changeEditorLevel} level={playLevel} game={game} />
          </View>

          {/* MENU */}
          <View style={styles.page}>
            <HomePage darkModeCallback={toggleDarkMode} setThemeCallback={setCurTheme} audioModeCallback={toggleAudioMode}
              setSensitivityCallback={setSensitivity} setTapDelayCallback={setTapDelay}></HomePage>
          </View>

        </ScrollView>}

        {/* To keep footer position normal */}
        {view !== "home" && <View style={styles.page} />}

        {/* GAMEPLAY VIEW */}
        {view === "play" && <Animated.View style={styles.modal(anim, darkMode)}>
          <PlayLevel viewCallback={switchView} levelCallback={changePlayLevel}
            gameStateCallback={setGameState} level={playLevel} game={game} />
        </Animated.View>}

        {/* EDIT VIEW */}
        {view === "edit" && <Animated.View style={styles.modal(anim, darkMode)}>
          <CreateLevel viewCallback={switchView} playLevelCallback={changePlayLevel} editorLevelCallback={changeEditorLevel}
            storeLevelCallback={setEditorLevelObj} levelIndex={editorLevel} levelObj={editorLevelObj} playTestCallback={() => { }} />
        </Animated.View>}

        {/* BOTTOM NAVIGATION */}
        <Animated.View style={styles.navbar(anim)}>
          <IconButton onPress={() => { scrollRef.current?.scrollTo({ x: 0, animated: true }); }}
            source={page === 0 ? graphics.PLAY_FILLED_ICON : graphics.PLAY_OUTLINED_ICON} />
          <IconButton onPress={() => { scrollRef.current?.scrollTo({ x: win.width, animated: true }); }}
            source={page === 1 ? graphics.SHARE_FILLED_ICON : graphics.SHARE_OUTLINED_ICON} />
        </Animated.View>
      </SafeAreaView>
      <StatusBar style="auto" />
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
    alignItems: 'center',
    justifyContent: 'center',
    width: win.width,
    paddingHorizontal: win.width * 0.225,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.MAIN_COLOR_TRANSPARENT(0.3),
  },
  header: (anim) => ({
    paddingTop: RNStatusBar.currentHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: '2%',
    width: win.width,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -100],
      }),
    }],
  }),
  navbar: (anim) => ({
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingBottom: '2%',
    paddingTop: '4%',
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100],
      }),
    }],
  }),
  modal: (anim, darkMode) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    opacity: anim,
  }),
});
