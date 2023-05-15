import React from "react"
import { Pressable, StyleSheet } from "react-native";
import Svg, { Path, G, Mask, Defs, LinearGradient, Stop } from "react-native-svg"

export function TileIcon({ bgColor, tileSize, pressCallback, tileType }) {
  let icon;
  switch (tileType) {
    case "crate":
      icon = <CrateIcon tileSize={tileSize} styleProp={styles.tile(bgColor, tileSize)} />;
      break;
    case "bomb":
      icon = <BombIcon tileSize={tileSize} styleProp={styles.tile(bgColor, tileSize)} />;
      break;
  
    default:
      break;
  }

  // if (!pressCallback) {
    return (icon);
  // }

  // return (
  //   <Pressable onPress={pressCallback}
  //     touchSoundDisabled={true} android_disableSound={true}>
  //     {icon}
  //   </Pressable>
  // );
}

export function CrateIcon({ tileSize, styleProp }) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path fill="#B19CD8" d="M20 20H80V80H20z" />
      <Path opacity={0.05} fill="#15101A" d="M20 20H80V80H20z" />
      <G opacity={0.4}>
        <Mask id="a" fill="#fff">
          <Path d="M20 15h60v15H20V15z" />
        </Mask>
        <Path d="M80 25H20v10h60V25z" fill="#BEA9DF" mask="url(#a)" />
      </G>
      <G opacity={0.4}>
        <Mask id="b" fill="#fff">
          <Path d="M20 30h60v15H20V30z" />
        </Mask>
        <Path d="M80 40H20v10h60V40z" fill="#BEA9DF" mask="url(#b)" />
      </G>
      <G opacity={0.4}>
        <Mask id="c" fill="#fff">
          <Path d="M20 45h60v15H20V45z" />
        </Mask>
        <Path d="M80 55H20v10h60V55z" fill="#BEA9DF" mask="url(#c)" />
      </G>
      <G opacity={0.4}>
        <Mask id="d" fill="#fff">
          <Path d="M20 60h60v15H20V60z" />
        </Mask>
        <Path d="M80 70H20v10h60V70z" fill="#BEA9DF" mask="url(#d)" />
      </G>
      <Path
        transform="rotate(-45 12.929 80.175)"
        fill="#BEA9DF"
        d="M12.929 80.1751H107.929V90.1751H12.929z"
      />
      <Path transform="rotate(45 20 13)" fill="#BEA9DF" d="M20 13H115V23H20z" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M90 90V10H10v80h80zM80 80H20V20h60v60z"
        fill="#CCB7E5"
      />
      <Path opacity={0.1} d="M10 71l80-27.5V90H10V71z" fill="#15101A" />
    </Svg>
  );
}

export function BombIcon({ tileSize, styleProp }) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M74.2 26.116l.884.698.511.457.716.596c1.097.912 3.728 3.575 4.397 4.46.678.885 1.292 1.853 1.292 2.03 0 .093-4.852 5.764-6.526 7.617-.174.193-.167.205.244.904l.017.028c.66 1.117 1.924 3.761 2.389 5.028 1.366 3.688 2.017 7.338 2.017 11.37 0 2.328-.093 3.483-.428 5.522-.883 5.345-3.04 10.215-6.507 14.713-.985 1.276-3.913 4.255-5.15 5.224-3.235 2.56-6.553 4.367-10.225 5.578-8.274 2.738-17.253 2.067-24.96-1.863A32.633 32.633 0 0118.51 74.091c-5.42-10.68-4.508-23.606 2.362-33.42 4.88-6.956 12.326-11.79 20.618-13.363 5-.95 10.355-.69 15.291.736 1.153.335 3.31 1.126 3.942 1.452l.437.214 3.355-3.855L67.87 22l.437.186c1.05.447 3.681 2.207 5.894 3.93z"
        fill="url(#paint0_linear_542_2262)"
      />
      <Path
        d="M66 6.5l-1-3 2 3L68 3v4l3-5-2 5.5L72.5 5l-3 3.5-1.5 1 1 .5c-1.772 8.028 30.058-1.578 8 20l-4-3c17.37-14.474-11.722-2.209-7.5-18h1L66 6.5z"
        fill="#FB6C6C"
        fillOpacity={0.5}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.084 26.814l-.883-.698c-2.213-1.723-4.843-3.483-5.894-3.93L67.87 22l-3.356 3.855-3.355 3.855c6.836 3.86 9.79 6.713 14.208 12.468-.005-.077.036-.125.107-.204C77.147 40.121 82 34.45 82 34.357c0-.177-.614-1.145-1.292-2.03-.67-.885-3.3-3.548-4.397-4.46l-.716-.596-.511-.457z"
        fill="#F79B9B"
      />
      <Path
        opacity={0.075}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M76.047 43.464c.69 1.28 1.678 3.383 2.077 4.47 1.366 3.688 2.017 7.338 2.017 11.37 0 2.328-.093 3.483-.428 5.522-.883 5.345-3.04 10.215-6.507 14.713-.985 1.276-3.913 4.255-5.15 5.224-3.235 2.56-6.553 4.367-10.225 5.578-8.274 2.738-17.253 2.067-24.96-1.863a32.618 32.618 0 01-13.918-13.542c27.71 8.023 57.432-4.464 57.094-31.473z"
        fill="#0E0A09"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_542_2262"
          x1={82}
          y1={92}
          x2={0.462505}
          y2={50.7032}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.152248} stopColor="#FB6C6C" />
          <Stop offset={0.823245} stopColor="#F79B9B" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

const styles = StyleSheet.create({
  tile: (bgColor, size) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
  entityContainer: (size) => ({
    position: "absolute",
    width: size,
    height: size,
    paddingTop: "17.5%",
    paddingRight: "5%",
    justifyContent: "center",
    alignItems: "center",
  }),
  entity: (fontSize) => ({
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
    fontSize: fontSize
  }),
});