import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Animated } from 'react-native';
import Colors from './Colors';
import MenuButton from './components/MenuButton';
import About from './pages/About';
import HowToPlay from './pages/HowToPlay';
import LevelSelect from './pages/LevelSelect';
import PlayLevel from './pages/PlayLevel';

export default function App() {
  const [page, setPageState] = useState("home"); 
  // The page the app is currently on. All pages are
  // displayed in the modal except the home page.
  const setPage = (value) => {
    if (value === "home") {
      setAnimTo(0, () => { setPageState(value) });
    } else {
      setAnimTo(1);
      setPageState(value);
    }
  }

  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = (null_) => { // scuffed but I think it needs to be there due to MenuButton implementation
    setDarkMode(current => !current);
  } 
  
  const [level, setLevelState] = useState(1);
  const content = getContentFromPage(page);
  function getContentFromPage(page_id) {
    switch (page_id) {
      case "level_select":
        return <LevelSelect pageCallback={setPage} levelCallback={setLevelState}/>;
      case "play_level":
        return <PlayLevel pageCallback={setPage} level={level}/>;
      case "how_to_play":
        return <HowToPlay pageCallback={setPage} darkMode={darkMode}/>;
      case "about":
        return <About pageCallback={setPage} darkMode={darkMode} darkModeCallback={toggleDarkMode}/>;
      default:
        return <MenuButton onPress={setPage} value="home" label="Back to Menu" icon={require('./assets/door.png')}/>;
    }
  }

  const anim = useRef(new Animated.Value(0)).current;
  const setAnimTo = (anim_state, callback) => {
    // MAKE SURE 0 <= anim_state <= 1
    Animated.timing(anim, {
      toValue: anim_state,
      duration: 500,
      useNativeDriver: true
    }).start(callback);
  };

  return (
    <View style={{
      ...styles.body,
      backgroundColor: (darkMode) ? Colors.BLUE_BLACK : "white",
    }}>
      <Image style={styles.banner} source={require('./assets/banner.png')}/>
      <MenuButton onPress={setPage} value="level_select" label="Level Select" icon={require('./assets/flag.png')}/>
      <MenuButton onPress={setPage} value="how_to_play" label="How to Play" icon={require('./assets/help.png')}/>
      <MenuButton onPress={setPage} value="about" label="About C&C" icon={require('./assets/player.png')}/>
      <StatusBar style="auto" />
      {page !== "home" && 
        <Animated.View style={{
          ...styles.modal,
          backgroundColor: (darkMode) ? Colors.BLUE_BLACK : "white",
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
