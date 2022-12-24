import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated } from 'react-native';

import { colors, graphics } from './Theme';
import MenuButton from './components/MenuButton';
import About from './pages/About';
import HowToPlay from './pages/HowToPlay';
import LevelSelect from './pages/LevelSelect';
import PlayLevel from './pages/PlayLevel';
import CreateLevel from './pages/CreateLevel';
import Settings from './pages/Settings';
import { GlobalContext } from './GlobalContext';

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

  const [darkMode, setDarkMode] = useState(false);
  const [dragSensitivity, setSensitivity] = useState(60);
  const [doubleTapDelay, setTapDelay] = useState(250);
  const [curTheme, setCurTheme] = useState("purple");
  const toggleDarkMode = () => {
    NavigationBar.setBackgroundColorAsync(darkMode ? "white" : "black");
    setDarkMode(current => !current);
  }

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
      case "level_select":
        return <LevelSelect pageCallback={setPage} levelCallback={changeLevel} />;

      case "play_level":
      case "test_level":
        return <PlayLevel pageCallback={setPage} levelCallback={changeLevel}
          gameStateCallback={setGameState} level={level} game={game} test={page_id === "test_level"} />;

      case "level_editor":
        return <CreateLevel pageCallback={setPage} levelCallback={changeLevel}
          level={editorLevel} storeLevelCallback={setEditorLevel} />;

      case "how_to_play":
        return <HowToPlay pageCallback={setPage} />;

      case "about":
        return <About pageCallback={(page) => setPage(page, true)} />;

      case "settings":
        return <Settings pageCallback={(page) => setPage(page, true)} darkModeCallback={toggleDarkMode}
          setThemeCallback={setCurTheme} setSensitivityCallback={setSensitivity} setTapDelayCallback={setTapDelay} />;

      default:
        return <MenuButton onPress={setPage} value="home" label="Back to Menu" icon={graphics.DOOR} />;
    }
  }

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (anim_state, callback) => {
    // MAKE SURE 0 <= anim_state <= 1
    Animated.timing(anim, {
      toValue: anim_state,
      duration: 300,
      useNativeDriver: true
    }).start(callback);
  };

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
        {game && !game.won && !game.playtest &&
          <MenuButton onPress={setPage} value="play_level" label="Resume Game" icon={graphics.KEY} />}

        <MenuButton onPress={setPage} value="level_select" label="Level Select" icon={graphics.FLAG} />
        <MenuButton onPress={setPage} value="level_editor" label="Level Editor" icon={graphics.HAMMER_ICON} />
        <MenuButton onPress={setPage} value="how_to_play" label="How to Play" icon={graphics.HELP_ICON} />
        <MenuButton onPress={setPage} value="settings" label="App Settings" icon={graphics.OPTIONS_ICON} />

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
