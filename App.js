import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated, BackHandler } from 'react-native';

import { colors, graphics, nextTheme } from './Theme';
import MenuButton from './components/MenuButton';
import About from './pages/About';
import HowToPlay from './pages/HowToPlay';
import LevelSelect from './pages/LevelSelect';
import PlayLevel from './pages/PlayLevel';
import CreateLevel from './pages/CreateLevel';
import Settings from './pages/Settings';
import { GlobalContext } from './GlobalContext';
import SubMenu from './pages/SubMenu';
import ShareLevel from './pages/ShareLevel';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': require('./assets/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('./assets/Montserrat-Medium.ttf'),
  });

  const [page, setPageState] = useState("home");
  // The page the app is currently on. All pages are displayed in the modal 
  // except the home page. The full transistion means playing the modal close and open
  // animation instead of direclty switching page to page.
  const setPage = (value, useFullTransition) => {
    if (page === "settings") {
      // If we just left the settings page, store our settings changes.
      writeSettingsToStorage();
    }

    useFullTransition = true;
    if (value === "home") {
      setAnimTo(0, () => { setPageState(value) });
    } else if (useFullTransition && page !== "home" && value !== "home") {
      setAnimTo(0, () => {
        setPageState(value);
        setAnimTo(1);
      });
    } else {
      setAnimTo(1);
      setPageState(value);
    }
  }

  async function storeData(value, storageKey) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storageKey, jsonValue);
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

  // These functions are used by children (probably only the settings page)
  // to modify App's state, and we use them to abstract that away from those
  // components and because we have the state and AyncStorage here.

  const toggleDarkMode = () => {
    NavigationBar.setBackgroundColorAsync(darkMode ? "white" : "black");
    setDarkMode(current => !current);
  }

  async function readSettingsFromStorage() {
    const storedDarkMode = await getData("isAppDarkMode", "boolean", false);
    setDarkMode(storedDarkMode);
    NavigationBar.setBackgroundColorAsync(storedDarkMode ? "black" : "white");
    console.log(storedDarkMode);

    setSensitivity(await getData("appDragSensitivity", "number", 60));
    setTapDelay(await getData("appDoubleTapDelay", "number", 250));

    let theme = "purple"; // by default, Theme.js exports purple theme
    const targetTheme = await getData("appTheme", "string", "purple");
    while (theme !== targetTheme) {
      theme = nextTheme();
    }
    setCurTheme(theme);
  }

  async function writeSettingsToStorage() {
    storeData(darkMode, "isAppDarkMode");
    storeData(dragSensitivity, "appDragSensitivity");
    storeData(doubleTapDelay, "appDoubleTapDelay");
    storeData(curTheme, "appTheme");

    console.log(darkMode, dragSensitivity, doubleTapDelay, curTheme);
  }

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

  const content = getContentFromPage(page);
  function getContentFromPage(page_id) {
    switch (page_id) {
      case "play_submenu":
        return <SubMenu pageCallback={setPage} game={game} />

      case "level_select":
        return <LevelSelect pageCallback={setPage} levelCallback={changeLevel} />;

      case "play_level":
      case "test_level":
        return <PlayLevel pageCallback={setPage} levelCallback={changeLevel}
          gameStateCallback={setGameState} level={level} game={game} test={page_id === "test_level"} />;

      case "level_editor":
        return <CreateLevel pageCallback={setPage} levelCallback={changeLevel}
          level={editorLevel} storeLevelCallback={setEditorLevel} />;

      case "share_level":
        return <ShareLevel pageCallback={setPage} level={level}/>;

      case "how_to_play":
        return <HowToPlay pageCallback={setPage} />;

      case "about":
        return <About pageCallback={setPage}/>;

      case "settings":
        return <Settings pageCallback={setPage} darkModeCallback={toggleDarkMode}
          setThemeCallback={setCurTheme} setSensitivityCallback={setSensitivity} setTapDelayCallback={setTapDelay} />;

      default:
        return <MenuButton onPress={setPage} value="home" label="Back to Menu" icon={graphics.DOOR} />;
    }
  }

  useEffect(() => {
    const backAction = () => {
      if (page === "play_level" || page === "test_level") {
        return true;
      } else if (page === "level_editor" || page === "level_select" || page === "share_level") {
        setPage("play_submenu");
        return true;
      } else if (page !== "home") {
        setPage("home");
        return true;
      }
      return false;
    }
    BackHandler.addEventListener("hardwareBackPress", backAction);

    return () =>
      BackHandler.removeEventListener("hardwareBackPress", backAction);
  }, [page]);

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (anim_state, callback) => {
    // MAKE SURE 0 <= anim_state <= 1
    Animated.timing(anim, {
      toValue: anim_state,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalContext.Provider value={{ darkMode, dragSensitivity, doubleTapDelay }}>
      <View style={{
        ...styles.body,
        backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
      }}>
        <Image style={styles.banner} source={graphics.TITLE_BANNER} />

        <MenuButton onPress={setPage} value="play_submenu" label="Play Game" icon={graphics.FLAG} />
        <MenuButton onPress={setPage} value="how_to_play" label="How to Play" icon={graphics.HELP_ICON} />
        <MenuButton onPress={setPage} value="settings" label="App Settings" icon={graphics.OPTIONS_ICON} />
        <MenuButton onPress={setPage} value="about" label="About the App" icon={graphics.PLAYER} />

        <StatusBar style="auto" />
        {page !== "home" &&
          <Animated.View style={{
            ...styles.modal,
            backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
            opacity: anim,
            transform: [{
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            }],
          }}>
            {content}
          </Animated.View>
        }
      </View>
    </GlobalContext.Provider>
  );
}

// Returns a list [height, width] of the size for an element based
// on the image's size and the desired width percent to be occupied.
const win = Dimensions.get('window');
function sizeFromWidthPercent(percent, img_height, img_width) {
  const ratio = win.width * percent / img_width;
  return [win.width * percent, ratio * img_height];
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.9, 141, 681)[0],
    height: sizeFromWidthPercent(0.9, 141, 681)[1],
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: win.width * 0.225,
  },
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
