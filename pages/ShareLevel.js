import { Text, StyleSheet, Image, Dimensions, View, Animated } from 'react-native';
import React, { useContext, useEffect, useRef, useState } from "react";
import SvgQRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, graphics } from '../Theme';
import MenuButton from '../components/MenuButton';
import { GlobalContext } from '../GlobalContext';
import { getTileEntityData, levels } from '../Game';
import Selector from '../components/Selector';

export default function ShareLevel({ pageCallback }) {
  const { darkMode, _ } = useContext(GlobalContext);
  const [level, selectLevel] = useState(0);

  function nextLevel() {
    selectLevel(level === levels.length - 1 ? 0 : level + 1);
  }
  function prevLevel() {
    selectLevel(level === 0 ? levels.length - 1 : level - 1);
  }

  const levelObj = levels[level];
  const encoding = levelToEncodingString(levelObj);

  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(true);
  const [info, setInfo] = useState("Requesting camera permissions.");

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const end = (info === "") ? 0 : 1;
    Animated.timing(anim, {
      toValue: end,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [info]);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
      if (status === "granted") {
        setInfo("");
      } else {
        setInfo("No camera permissions, cannot scan.");
      }
    };

    getBarCodeScannerPermissions();
  }, []);

  async function handleBarCodeScanned({ type, data }) {
    setScanned(true);
    const levelObj = encodingStringToLevel(data);
    const existsLevel = await checkData(levelObj.name);

    printLevel(levelObj);
    if (!existsLevel) {
      const success = await storeData(levelObj, levelObj.name);
      if (success) {
        setInfo(`Successfully stored data for level "${levelObj.name}" by "${levelObj.designer}".`);
      } else {
        setInfo(`Failed to store data for level "${levelObj.name}" by "${levelObj.designer}".`);
      }
    } else {
      setInfo(`Level with name "${levelObj.name}" already exists!`);
    }

    setTimeout(() => {
      setInfo("");
    }, 4500);
  };

  // ==================
  // LOCAL DATA STORAGE
  // ==================
  async function storeData(value, storage_key) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storage_key, jsonValue);
      return true;
    } catch (err) {
      console.log("\n\n(ERROR) >>> SAVING ERROR:\n", err);
      return false;
    }
  }

  // Local Data Reading
  async function checkData(storage_key) {
    try {
      const jsonValue = await AsyncStorage.getItem(storage_key);
      return jsonValue != null;
    } catch (err) {
      console.log("\n\n(ERROR) >>> READING ERROR:\n", err);
      return false;
    }
  }

  return (
    <>
      {/* <Image style={styles.banner} source={graphics.SHARE_BANNER} /> */}

      <Text style={{ ...styles.text(darkMode), zIndex: 1 }}>
        Scan this QR code to download level
        "<Text style={styles.bold(darkMode)}>{levelObj.name}</Text>"
        by "<Text style={styles.bold(darkMode)}>{levelObj.designer}</Text>",
        or click the button below to load a level from a QR code.
      </Text>

      <View style={{ height: 15 }} />
      {scanned &&
        <SvgQRCode value={encoding} enableLinearGradient={true} linearGradient={[colors.MAIN_COLOR, colors.DARK_COLOR]} backgroundColor={"transparent"} />}
      {!scanned && <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ height: "50%", width: "100%" }} />}
      <Animated.Text style={{ ...styles.bold(darkMode), ...styles.info(darkMode, anim) }}>{info}</Animated.Text>
      {scanned && <>
        <View style={{ height: 35 }} />
        <Selector onNext={nextLevel} onPrev={prevLevel} label={`Share "${levelObj.name}" QR`} />
      </>}

      <View style={{ height: 15 }} />
      <View style={styles.buttonsContainer}>
        <MenuButton onPress={setScanned} value={!scanned} label="Scan Level QR" icon={graphics.LOAD_ICON} />
        <MenuButton onPress={pageCallback} value={false} label="Go Back" icon={graphics.DOOR} />
      </View>
    </>
  );
}

function levelToEncodingString(levelObj) {
  let encodedStr = `${levelObj.name},${levelObj.designer},${levelObj.created},`;
  for (let i = 0; i < levelObj.board.length; i++) {
    for (let j = 0; j < levelObj.board[0].length; j++) {
      const tile = levelObj.board[i][j];

      if (getTileEntityData(tile).type === null) {
        encodedStr += levelObj.board[i][j];
      } else {
        encodedStr += "(" + levelObj.board[i][j] + ")";
      }
    }
    encodedStr += ";"
  }
  return encodedStr.slice(0, -1);
}

function encodingStringToLevel(encondedStr) {
  try {
    const data = encondedStr.split(",");
    const rawBoard = data[3].split(";");

    console.log(rawBoard);

    const board = [];
    for (let i = 0; i < rawBoard.length; i++) {
      const row = [];

      let j = 0;
      while (j < rawBoard[i].length) {
        const char = rawBoard[i][j];

        if (char === "(") {
          // We have the start of a tile entity.
          let entity = "";
          j++;
          
          while (rawBoard[i][j] !== ")") {
            console.log(rawBoard[i][j]);
            entity += rawBoard[i][j];
            j++;
          }
          row.push(entity);
          j++;
        } else {
          row.push(parseInt(rawBoard[i][j]));
          j++;
        }
      }

      board.push(row);
    }

    return {
      name: data[0],
      designer: data[1],
      created: data[2],
      board: board,
    }
  } catch (err) {
    console.log("\n\n(ERROR) >>> QR READING ERROR:\n", err);
    return null;
  }
}

function printLevel(levelObj) {
  console.log(levelObj.name);
  console.log(levelObj.designer);
  console.log(levelObj.created);

  for (let i = 0; i < levelObj.board.length; i++) {
    let line = "[";
    for (let j = 0; j < levelObj.board[0].length; j++) {
      line += levelObj.board[i][j] + ", ";
    }
    console.log(line + "];");
  }
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
    width: sizeFromWidthPercent(0.8, 146, 600)[0],
    height: sizeFromWidthPercent(0.8, 146, 600)[1],
    zIndex: 1,
  },
  text: darkMode => ({
    width: win.width * 0.8,
    marginBottom: 10,
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
  }),
  bold: darkMode => ({
    color: (darkMode) ? colors.MAIN_COLOR : colors.DARK_COLOR,
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  }),
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: win.width * 0.45,
  },
  info: (darkMode, anim) => ({
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.9],
    }),
    position: "absolute",
    paddingTop: win.height / 2 - 25,
    paddingBottom: win.height / 2 + 25,
    width: "100%",
    textAlign: "center",
    zIndex: 0,
  }),
});