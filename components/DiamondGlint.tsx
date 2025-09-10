import { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";
import { graphics } from "../Theme";

interface Props {
  tileSize: number;
  glintCount?: number;
}

export default function DiamondGlint({ tileSize, glintCount = 5 }: Props) {
  const glintAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loopingAnimation = Animated.loop(
      Animated.timing(glintAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      { resetBeforeIteration: true }
    );
    loopingAnimation.start();
    return () => loopingAnimation.stop();
  }, []);

  // Random integer between min (inclusive) and max (inclusive)
  function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randomSample<T>(array: T[]): T { return array.splice(randomInt(0, array.length - 1), 1)[0]; }

  const glintEntities = useMemo(() => {
    const newGlintEntities: React.ReactNode[] = [];
    const interval = [...Array(glintCount * 2).keys()];

    const minPos = tileSize * 0.1;
    const posRange = tileSize * 0.8;

    const possibleX = interval.map(idx => idx / interval.length * posRange + minPos);
    const possibleY = interval.map(idx => idx / interval.length * posRange + minPos);

    for (let i = 0; i < glintCount; i++) {
      const size = tileSize / randomInt(4, 10);

      const posX = randomSample(possibleX);
      const posY = randomSample(possibleY);

      const delay = Math.random();
      const phase = Animated.modulo(Animated.add(glintAnim, delay), 1);

      newGlintEntities.push(<Animated.Image
        key={i} source={graphics.DIAMOND_GLINT}
        style={{
          width: size,
          height: size,
          opacity: phase.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 1, 0],
          }),
          transform: [
            {
              rotate: phase.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
            {
              scale: phase.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
            },
          ],
          position: "absolute",
          left: posX,
          top: posY,
        }}
      />);
    }

    return newGlintEntities;
  }, [glintCount]);

  return (glintEntities);
}
