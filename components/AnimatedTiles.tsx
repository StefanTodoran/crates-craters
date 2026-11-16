import { memo, useMemo } from "react";
import { Animated } from "react-native";
import Svg, { Circle, ClipPath, Defs, Path, Rect } from "react-native-svg";
import { useLoopClock } from "../util/hooks";

/**
 * Animated versions of the flag, key and metal crate tiles, from
 * assets/svg/flag_animated.svg, key_animated.svg and metal_crate_animated.svg.
 * React Native can't play SMIL, so each one interpolates its moving path's `d`
 * from a JS-driven clock (path data can't use the native driver). They're memoized so
 * board re-renders (every move) don't re-attach their animated props.
 */

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  tileSize: number,
  bgColor: string,
  phase?: number, // 0-1 offset into the shared loop, so neighbouring tiles don't sweep in unison.
}

function usePhasedLoop(duration: number, phase: number) {
  const clock = useLoopClock(duration, false);
  return useMemo(() => phase ? Animated.modulo(Animated.add(clock, phase), 1) : clock, [clock, phase]);
}

// ---------- Flag ----------

// One sine wave per cloth edge whose phase advances; the pole and fly ends stay put.
const FLAG_CLOTH_FRAMES = [
  "M84.00 48.00C83.04 47.71 80.15 46.73 78.22 46.23C76.29 45.73 74.36 45.06 72.44 45.00C70.51 44.94 68.58 45.38 66.66 45.88C64.73 46.38 62.80 47.29 60.88 48.00C58.95 48.71 57.02 49.62 55.09 50.12C53.17 50.62 51.24 51.06 49.31 51.00C47.39 50.94 45.46 50.27 43.53 49.77C41.60 49.27 38.71 48.29 37.75 48.00L37.75 20.00M37.75 20.00C38.71 20.29 41.60 21.27 43.53 21.77C45.46 22.27 47.39 22.94 49.31 23.00C51.24 23.06 53.17 22.62 55.09 22.12C57.02 21.62 58.95 20.71 60.88 20.00C62.80 19.29 64.73 18.38 66.66 17.88C68.58 17.38 70.51 16.94 72.44 17.00C74.36 17.06 76.29 17.73 78.22 18.23C80.15 18.73 83.04 19.71 84.00 20.00L77.5 33L84 48Z",
  "M84.00 48.00C83.04 47.71 80.15 46.23 78.22 46.23C76.29 46.23 74.36 47.35 72.44 48.00C70.51 48.65 68.58 49.62 66.66 50.12C64.73 50.62 62.80 51.00 60.88 51.00C58.95 51.00 57.02 50.62 55.09 50.12C53.17 49.62 51.24 48.65 49.31 48.00C47.39 47.35 45.46 46.23 43.53 46.23C41.60 46.23 38.71 47.71 37.75 48.00L37.75 20.00M37.75 20.00C38.71 19.71 41.60 18.23 43.53 18.23C45.46 18.23 47.39 19.35 49.31 20.00C51.24 20.65 53.17 21.62 55.09 22.12C57.02 22.62 58.95 23.00 60.88 23.00C62.80 23.00 64.73 22.62 66.66 22.12C68.58 21.62 70.51 20.65 72.44 20.00C74.36 19.35 76.29 18.23 78.22 18.23C80.15 18.23 83.04 19.71 84.00 20.00L77.5 33L84 48Z",
  "M84.00 48.00C83.04 48.29 80.15 49.27 78.22 49.77C76.29 50.27 74.36 50.94 72.44 51.00C70.51 51.06 68.58 50.62 66.66 50.12C64.73 49.62 62.80 48.71 60.88 48.00C58.95 47.29 57.02 46.38 55.09 45.88C53.17 45.38 51.24 44.94 49.31 45.00C47.39 45.06 45.46 45.73 43.53 46.23C41.60 46.73 38.71 47.71 37.75 48.00L37.75 20.00M37.75 20.00C38.71 19.71 41.60 18.73 43.53 18.23C45.46 17.73 47.39 17.06 49.31 17.00C51.24 16.94 53.17 17.38 55.09 17.88C57.02 18.38 58.95 19.29 60.88 20.00C62.80 20.71 64.73 21.62 66.66 22.12C68.58 22.62 70.51 23.06 72.44 23.00C74.36 22.94 76.29 22.27 78.22 21.77C80.15 21.27 83.04 20.29 84.00 20.00L77.5 33L84 48Z",
  "M84.00 48.00C83.04 48.29 80.15 49.77 78.22 49.77C76.29 49.77 74.36 48.65 72.44 48.00C70.51 47.35 68.58 46.38 66.66 45.88C64.73 45.38 62.80 45.00 60.88 45.00C58.95 45.00 57.02 45.38 55.09 45.88C53.17 46.38 51.24 47.35 49.31 48.00C47.39 48.65 45.46 49.77 43.53 49.77C41.60 49.77 38.71 48.29 37.75 48.00L37.75 20.00M37.75 20.00C38.71 20.29 41.60 21.77 43.53 21.77C45.46 21.77 47.39 20.65 49.31 20.00C51.24 19.35 53.17 18.38 55.09 17.88C57.02 17.38 58.95 17.00 60.88 17.00C62.80 17.00 64.73 17.38 66.66 17.88C68.58 18.38 70.51 19.35 72.44 20.00C74.36 20.65 76.29 21.77 78.22 21.77C80.15 21.77 83.04 20.29 84.00 20.00L77.5 33L84 48Z",
  "M84.00 48.00C83.04 47.71 80.15 46.73 78.22 46.23C76.29 45.73 74.36 45.06 72.44 45.00C70.51 44.94 68.58 45.38 66.66 45.88C64.73 46.38 62.80 47.29 60.88 48.00C58.95 48.71 57.02 49.62 55.09 50.12C53.17 50.62 51.24 51.06 49.31 51.00C47.39 50.94 45.46 50.27 43.53 49.77C41.60 49.27 38.71 48.29 37.75 48.00L37.75 20.00M37.75 20.00C38.71 20.29 41.60 21.27 43.53 21.77C45.46 22.27 47.39 22.94 49.31 23.00C51.24 23.06 53.17 22.62 55.09 22.12C57.02 21.62 58.95 20.71 60.88 20.00C62.80 19.29 64.73 18.38 66.66 17.88C68.58 17.38 70.51 16.94 72.44 17.00C74.36 17.06 76.29 17.73 78.22 18.23C80.15 18.73 83.04 19.71 84.00 20.00L77.5 33L84 48Z",
];

export const AnimatedFlagIcon = memo(function AnimatedFlagIcon({ tileSize, bgColor, phase = 0 }: Props) {
  const t = usePhasedLoop(2500, phase);
  const d = useMemo(() => t.interpolate({
    inputRange: FLAG_CLOTH_FRAMES.map((_, i) => i / (FLAG_CLOTH_FRAMES.length - 1)),
    outputRange: FLAG_CLOTH_FRAMES,
  }), [t]);

  return (
    <Svg width={tileSize} height={tileSize} viewBox="0 0 100 100" fill="none" style={{ width: tileSize, height: tileSize, backgroundColor: bgColor }}>
      <AnimatedPath d={d} fill="#FFE7A8" />
      <Rect x={28} y={13} width={10} height={80} fill="#FFD873" />
      <Circle cx={33} cy={14} r={8} fill="#FFD873" />
      <Path d="M28 70.5L38 63.5V93H28V70.5Z" fill="#EFCA67" />
      <Path
        d="M39.8564 10C42.0655 13.8263 40.7545 18.7191 36.9282 20.9282C33.1019 23.1373 28.2091 21.8263 26 18C28.5981 16.5 29.1019 16.2091 32.9282 14C36.7545 11.7909 35.5263 12.5 39.8564 10Z"
        fill="#EAC563"
        fillOpacity={0.75}
      />
    </Svg>
  );
});

// ---------- Sheen ----------

const SHEEN_DURATION = 3000;
const SHEEN_PASS = 0.4; // The band crosses during the first 40% of the loop, then rests off-tile.

function useSheen(phase: number, from: string, to: string) {
  const t = usePhasedLoop(SHEEN_DURATION, phase);
  return useMemo(() => t.interpolate({
    inputRange: [0, SHEEN_PASS, 1],
    outputRange: [from, to, to],
  }), [t, from, to]);
}

// The band from the re-exported metal_crate.svg, slid from above the tile to below it.
const CRATE_SHEEN = ["M90 -44.13L10 -16.63V-35.25L90 -62.75Z", "M90 125.87L10 153.37V134.75L90 107.25Z"];

export const AnimatedMetalCrateIcon = memo(function AnimatedMetalCrateIcon({ tileSize, bgColor, phase = 0 }: Props) {
  const sheen = useSheen(phase, CRATE_SHEEN[0], CRATE_SHEEN[1]);
  return (
    <Svg width={tileSize} height={tileSize} viewBox="0 0 100 100" fill="none" style={{ width: tileSize, height: tileSize, backgroundColor: bgColor }}>
      <Defs>
        <ClipPath id="crateBodyClip">
          <Rect x={10} y={10} width={80} height={80} />
        </ClipPath>
      </Defs>
      <Rect x={20} y={20} width={60} height={60} fill="#F98585" />
      <Rect opacity={0.15} x={20} y={20} width={60} height={60} fill="#2A0E0E" />
      <Path d="M73 73V27H32.75H27V73H73ZM67.25 67.25H32.75V32.75H67.25V67.25Z" fillRule="evenodd" clipRule="evenodd" fill="#F98585" />
      <Path d="M62 62V38H38V62H62ZM56.2308 56.2308H43.7692V43.7692H56.2308V56.2308Z" fillRule="evenodd" clipRule="evenodd" fill="#F98585" />
      <Path d="M90 90V10H20H10V90H90ZM80 80H20V20H80V80Z" fillRule="evenodd" clipRule="evenodd" fill="#F98585" />
      <Path opacity={0.1} d="M10 71L90 43.5V90H10V71Z" fill="#2A0E0E" />
      <AnimatedPath clipPath="url(#crateBodyClip)" opacity={0.1} d={sheen} fill="#FFFCFC" />
    </Svg>
  );
});

// The key's silhouette, used both to draw it and to clip its sheen.
const KEY_SHAFT = "M77.5967 81.844C77.69 84.0544 77.2963 86.2062 76.7 86.6631C76.5475 86.7742 76.2638 86.8776 76.0677 86.8856C75.5447 86.9071 63.7539 82.1642 63.3576 81.7743C63.1799 81.5982 62.4853 80.6572 61.8153 79.6759L61.7982 79.6508C61.0574 78.5674 60.7037 78.0501 60.6197 77.4925C60.543 76.9829 60.6915 76.4397 60.9756 75.4L60.9793 75.3866C61.1946 74.5916 61.3353 73.8914 61.2944 73.8538C61.2405 73.8167 60.2277 73.7142 59.033 73.6454C57.8377 73.5635 56.7193 73.4392 56.5329 73.3682C56.146 73.2007 53.6817 69.7382 53.5386 69.1414C53.4606 68.8433 53.604 68.2085 54.088 66.6426C54.4458 65.5011 54.7187 64.5203 54.6647 64.4832C54.6239 64.4456 53.5958 64.2913 52.3842 64.1315C51.1725 63.9717 50.0382 63.7825 49.8655 63.7241C49.2928 63.4987 49.1928 62.9918 49.2148 60.4098L49.2461 58.0502L48.3672 56.7761C47.8923 56.075 47.4196 55.4262 47.3373 55.3379L38.5656 42.4945L50.5998 38.8432L56.9247 47.9079C56.9042 47.9291 58.1017 49.6589 59.5881 51.7422C66.6905 61.7615 73.1132 71.1929 75.5053 75.1169C76.814 77.2643 77.4967 79.4766 77.5967 81.844Z";
const KEY_BOW = "M54.0496 39.3658C54.0485 39.3396 54.1785 39.0067 54.3472 38.6591C55.3053 36.5365 55.6795 34.5427 55.6534 31.753C55.6291 29.3171 55.3656 27.7294 54.6972 25.8571C52.8443 20.7449 48.5454 16.6373 43.3834 15.0414C41.0593 14.3927 39.7696 14.2011 37.4968 14.2745C34.5295 14.4096 32.1988 15.0426 29.7416 16.4015C26.9386 17.9448 24.5707 20.1778 23.1171 22.6614C22.1767 24.4214 21.7198 25.4138 21.1743 27.2091C20.6377 29.0785 20.5101 30.7084 20.6962 33.2557C20.8676 35.7642 21.1843 37.0614 22.1361 39.1317C24.9495 45.2788 31.0793 49.3243 37.6694 49.3809L39.2677 49.3938L39.4049 49.9474C39.4732 50.2577 39.6343 51.3138 39.7746 52.2979C39.9016 53.2946 40.1013 54.2556 40.2002 54.4536C40.4631 54.9211 40.962 55.1145 41.5853 54.9728C41.6881 54.9495 41.7701 54.9309 41.8523 54.9034C42.1764 54.7952 42.5035 54.5501 44.1206 53.3382L44.2592 53.2344C44.3992 53.1289 44.5206 53.0386 44.6262 52.9618C48.2333 49.5933 50.475 47.8867 54.9859 45.2672C55.0125 45.242 55.6114 44.8567 56.331 44.4153C57.7487 43.5277 58.2281 43.0642 58.3248 42.5055C58.4565 41.68 57.7634 41.0707 55.3544 39.931L54.0496 39.3658ZM31.7333 28.832C31.9869 29.254 32.9722 29.9472 33.595 30.1181C35.9558 30.8203 38.2886 28.9949 38.1836 26.5098C38.1194 24.9892 37.0375 23.6918 35.7654 23.0328C35.1632 22.73 33.5354 23.124 32.8835 23.5046C32.2061 23.8993 31.494 24.7147 31.2596 25.3664C31.1535 25.6459 31.085 25.8845 31.1117 25.8965C30.912 26.4426 30.9589 27.783 31.7333 28.832Z";
const KEY_BLADE = "M56.0498 50.665L74.3403 77.3043C75.0163 78.9543 75.3594 79.8791 74.9251 81.5142L66.6337 72.7963L52.6468 52.4251L56.0498 50.665Z";
const KEY_SHADE = "M53.3239 22.9589C53.8684 23.8784 54.3311 24.8479 54.697 25.8573C55.3653 27.7295 55.6287 29.317 55.653 31.7528C55.6791 34.5425 55.3055 36.5365 54.3474 38.6591C54.1787 39.0067 54.0484 39.34 54.0495 39.3661L55.3542 39.9306C57.7632 41.0702 58.4566 41.6803 58.3249 42.5058C58.2282 43.0643 57.7483 43.5275 56.3308 44.4149C55.6112 44.8564 55.0126 45.2423 54.986 45.2675C50.4751 47.887 48.2328 49.5933 44.6257 52.9618C44.5203 53.0385 44.3993 53.129 44.2595 53.2343L44.1208 53.3378C42.5038 54.5496 42.1763 54.795 41.8522 54.9032C41.7702 54.9306 41.6883 54.9493 41.5856 54.9726C40.9624 55.1142 40.4629 54.9213 40.1999 54.454C40.1011 54.256 39.9011 53.2945 39.7741 52.2978C39.6338 51.3137 39.4733 50.2575 39.405 49.9472L39.2673 49.3935L37.6696 49.3808C35.0721 49.3584 32.5469 48.7144 30.2673 47.5683L53.3239 22.9589Z";

// The band from the re-exported key.svg (parallel to its shading), slid down along the shaft.
const KEY_SHEEN = ["M38.09 -3.07L-28.86 68.66L-37.60 52.21L28.62 -18.74Z", "M119.96 73.31L53.01 145.04L44.27 128.60L110.49 57.64Z"];

export const AnimatedKeyIcon = memo(function AnimatedKeyIcon({ tileSize, bgColor, phase = 0 }: Props) {
  const sheen = useSheen(phase, KEY_SHEEN[0], KEY_SHEEN[1]);
  return (
    <Svg width={tileSize} height={tileSize} viewBox="0 0 100 100" fill="none" style={{ width: tileSize, height: tileSize, backgroundColor: bgColor }}>
      <Defs>
        <ClipPath id="keyClip">
          <Path d={KEY_SHAFT} clipRule="evenodd" />
          <Path d={KEY_BOW} clipRule="evenodd" />
          <Path d={KEY_BLADE} />
        </ClipPath>
      </Defs>
      <Path d={KEY_SHAFT} fillRule="evenodd" clipRule="evenodd" fill="#8AD092" />
      <Path d={KEY_BOW} fillRule="evenodd" clipRule="evenodd" fill="#AADFAB" />
      <Path d={KEY_BLADE} fill="#AADFAB" />
      <Path opacity={0.05} d={KEY_SHADE} fill="#0E160E" />
      <AnimatedPath clipPath="url(#keyClip)" opacity={0.2} d={sheen} fill="#FFFCFC" />
    </Svg>
  );
});
