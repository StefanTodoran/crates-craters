import { Text, StyleSheet, View, Animated, ScrollView } from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import SvgQRCode from "react-native-qrcode-svg";
import { BarCodeScanner } from "expo-barcode-scanner";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { colors, graphics } from "../Theme";
import MenuButton from "../components/MenuButton";
import { GlobalContext } from "../GlobalContext";
import { countCustomLevels, levels } from "../Game";
import Selector from "../components/Selector";
import TextStyles, { sizeFromWidthPercent } from "../TextStyles";

export default function ShareLevel({ pageCallback }) {
  const { darkMode } = useContext(GlobalContext);

  const firstCustom = levels.findIndex(lvl => (lvl.designer !== "default" && lvl.designer !== "special"));
  const [level, selectLevel] = useState(firstCustom);

  const buttonsDisabled = countCustomLevels() === 1;
  function nextLevel() {
    let next = level;
    do {
      next = (next + 1) % levels.length;
    } while (levels[next].designer === "default" || levels[next].designer === "special");
    selectLevel(next);
  }
  function prevLevel() {
    let prev = level;
    do {
      prev = prev === 0 ? levels.length - 1 : prev - 1;
    } while (levels[prev].designer === "default" || levels[prev].designer === "special");
    selectLevel(prev);
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
    printLevel(levelObj);

    if (!levelObj) {
      setInfo("Failed to read level data. Double check the QR code.");
    } else {
      const existsLevel = await checkData(levelObj.name);

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
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{
      // paddingBottom: scanned ? win.height * 0.1 : win.height * 0.05,
      // paddingTop: scanned ? win.height * 0.1 : win.height * 0.05,
      justifyContent: "center",
      height: "100%",
    }} overScrollMode="never" showsVerticalScrollIndicator={false}>
      {scanned && <>
        <View style={{ marginBottom: 15, paddingHorizontal: win.width * 0.05 }}>
          <Text style={TextStyles.subtitle(darkMode)}>
            SHARE LEVELS
          </Text>
          <Text style={{ ...TextStyles.paragraph(darkMode), zIndex: 1 }}>
            Scan this QR code to download level
            "<Text style={TextStyles.bold(darkMode)}>{levelObj.name}</Text>"
            by "<Text style={TextStyles.bold(darkMode)}>{levelObj.designer}</Text>",
            or click the button below to load a level from a QR code.
          </Text>
        </View>

        <View style={styles.container}>
          <View style={styles.container}>
            <SvgQRCode value={encoding} enableLinearGradient={true} linearGradient={[colors.MAIN_PURPLE, colors.DARK_PURPLE]} backgroundColor={"transparent"} />
            <Animated.View style={styles.info(darkMode, anim)}>
              <Text style={TextStyles.bold(darkMode)}>{info}</Text>
            </Animated.View>
          </View>

          <View style={{ height: 35 }} />
          <Selector label={`Share "${levelObj.name}" QR`}
            onNext={nextLevel} nextDisabled={buttonsDisabled}
            onPrev={prevLevel} prevDisabled={buttonsDisabled} />
        </View>

        <View style={{ height: 15 }} />
        <View style={styles.buttonsContainer}>
          <MenuButton onPress={setScanned} value={!scanned} label="Scan Level QR" icon={graphics.LOAD_ICON} />
          <MenuButton onPress={pageCallback} value={false} label="Go Back" icon={graphics.DOOR_ICON} />
        </View>
      </>}
      {!scanned && <>
        <BarCodeScanner onBarCodeScanned={handleBarCodeScanned} style={{ height: win.height * 0.55 }} />

        <View style={{ height: 15 }} />
        <View style={styles.buttonsContainer}>
          <MenuButton onPress={setScanned} value={!scanned} label="Cancel Scan" icon={graphics.LOAD_ICON} />
        </View>
      </>}
    </ScrollView>
  );
}

function levelToEncodingString(levelObj) {
  let encodedStr = `${levelObj.name}&${levelObj.designer}&${levelObj.created}&`;

  for (let i = 0; i < levelObj.board.length; i++) {
    for (let j = 0; j < levelObj.board[0].length; j++) {
      encodedStr += levelObj.board[i][j] + ","
    }
    encodedStr += ";"
  }

  return encodedStr.slice(0, -1);
}

function encodingStringToLevel(encondedStr) {
  try {
    const data = encondedStr.split("&");
    const rawBoard = data[3].split(";");
    const board = [];

    for (let i = 0; i < rawBoard.length; i++) {
      const rawRow = rawBoard[i].split(",");
      const row = [];

      for (let j = 0; j < rawRow.length - 1; j++) { // -1 because of endline comma
        const tile = parseInt(rawRow[j]);

        if (!isNaN(tile)) {
          row.push(tile);
        } else {
          row.push(rawRow[j]);
        }
      }

      board.push(row);
    }

    return {
      name: data[0],
      designer: data[1],
      created: data[2],
      board: board,
      completed: false,
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
      const value = levelObj.board[i][j];
      if (typeof value === "string") {
        line += '"' + levelObj.board[i][j] + '", ';
      } else {
        line += levelObj.board[i][j] + ", ";
      }
    }
    console.log(line + "],");
  }
}

const styles = StyleSheet.create({
  banner: {
    width: sizeFromWidthPercent(0.8, 146, 600).width,
    height: sizeFromWidthPercent(0.8, 146, 600).height,
    zIndex: 1,
  },
  buttonsContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: win.width,
    paddingHorizontal: win.width * 0.225,
  },
  container: {
    alignItems: "center",
    width: "100%",
  },
  info: (darkMode, anim) => ({
    backgroundColor: (darkMode) ? colors.NEAR_BLACK : "white",
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.9],
    }),
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: win.width * 0.225,
  }),
});