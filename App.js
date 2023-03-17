import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated, BackHandler, ScrollView, SafeAreaView, Pressable } from 'react-native';

import { colors, graphics, nextTheme } from './Theme';
import { GlobalContext } from './GlobalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PlayPage from './pages/PlayPage';
import SharePage from './pages/SharePage';
import HomePage from './pages/HomePage';
import IconButton from './components/IconButton';

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
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (animState, callback) => {
    // MAKE SURE 0 <= animState <= 1
    Animated.timing(anim, {
      toValue: animState,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  useEffect(() => {
    setAnimTo(scrollEnabled ? 1 : 0);
  }, [scrollEnabled]);

  const [doPlayTest, setPlayTest] = useState(false);
  function openPlayTest() {
    setPlayTest(true);
    scrollRef.current?.scrollTo({ x: win.width, animated: true });
  }
  function backToEditor() {
    setPlayTest(false);
    scrollRef.current?.scrollTo({ x: win.width * 2, animated: true });
  }

  async function storeData(value, storageKey) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storageKey, jsonValue);

      // let checkValue = await AsyncStorage.getItem(storageKey);
      // checkValue = checkValue != null ? JSON.parse(checkValue) : null;
      // return value == checkValue;

      return true;
    } catch (err) {
      console.log("\n\n(ERROR) >>> SAVING ERROR:\n", err);
      return false;
    }
  }

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

  const [level, setLevelState] = useState(1); // the parent needs to know the level from LevelSelect to share with PlayLevel
  const [game, setGameState] = useState(null); // stores the game state so levels can be resumed
  const [editorLevel, setEditorLevel] = useState(null); // stores the level being created so it can be recovered
  const changeLevel = (lvl) => {
    setLevelState(lvl);
    setGameState(null);
  }

  useEffect(() => {
    const backAction = () => {
      return scrollEnabled;
    }
    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [scrollEnabled]); // TODO: update this

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay, playAudio }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white" }}>
        {/* PAGE CONTENT */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={(evt) => {
          setPageState(Math.round(evt.nativeEvent.contentOffset.x / win.width));
        }} scrollEnabled={scrollEnabled} ref={scrollRef}>
          <View style={styles.page}>
            <HomePage darkModeCallback={toggleDarkMode} setThemeCallback={setCurTheme} audioModeCallback={toggleAudioMode}
              setSensitivityCallback={setSensitivity} setTapDelayCallback={setTapDelay}></HomePage>
          </View>
          <View style={styles.page}>
            <PlayPage levelCallback={changeLevel} gameStateCallback={setGameState} scrollCallback={setScrollEnabled}
              editorCallback={backToEditor} level={level} game={game} playTest={doPlayTest}></PlayPage>
          </View>
          <View style={styles.page}>
            <SharePage levelCallback={changeLevel} storeLevelCallback={setEditorLevel} scrollCallback={setScrollEnabled}
              playTestCallback={openPlayTest} level={level} editorLevel={editorLevel}></SharePage>
          </View>
        </ScrollView>

        {/* HEADER BANNER */}
        <Animated.View style={styles.header(anim)}>
          <Image style={styles.banner} source={graphics.TITLE_BANNER} />
        </Animated.View>

        {/* <Animated.View style={styles.navbar(anim)}>
          <Pressable onPress={() => { scrollRef.current?.scrollTo({ x: 0, animated: true }); }}>
            <Image style={styles.icon} source={page === 0 ? graphics.HOME_FILLED_ICON : graphics.HOME_OUTLINED_ICON} />
          </Pressable>
          <Pressable onPress={() => { scrollRef.current?.scrollTo({ x: win.width, animated: true }); }}>
            <Image style={styles.icon} source={page === 1 ? graphics.PLAY_FILLED_ICON : graphics.PLAY_OUTLINED_ICON} />
          </Pressable>
          <Pressable onPress={() => { scrollRef.current?.scrollTo({ x: win.width * 2, animated: true }); }}>
            <Image style={styles.icon} source={page === 2 ? graphics.SHARE_FILLED_ICON : graphics.SHARE_OUTLINED_ICON} />
          </Pressable>
        </Animated.View> */}

        {/* BOTTOM NAVIGATION */}
        <Animated.View style={styles.navbar(anim)}>
          <IconButton onPress={() => { scrollRef.current?.scrollTo({ x: 0, animated: true }); }}
            source={page === 0 ? graphics.HOME_FILLED_ICON : graphics.HOME_OUTLINED_ICON} />
          <IconButton onPress={() => { scrollRef.current?.scrollTo({ x: win.width, animated: true }); }}
            source={page === 1 ? graphics.PLAY_FILLED_ICON : graphics.PLAY_OUTLINED_ICON} />
          <IconButton onPress={() => { scrollRef.current?.scrollTo({ x: win.width * 2, animated: true }); }}
            source={page === 2 ? graphics.SHARE_FILLED_ICON : graphics.SHARE_OUTLINED_ICON} />
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
    height: win.height,
    paddingHorizontal: win.width * 0.225,
  },
  header: (anim) => ({
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'center',
    width: win.width,
    top: '3%',
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 0],
      }),
    }],
  }),
  navbar: (anim) => ({
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingVertical: '2%',
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0],
      }),
    }],
  }),
  icon: {
    width: sizeFromWidthPercent(0.1, 100, 100)[0],
    height: sizeFromWidthPercent(0.1, 100, 100)[1],
  },
});
