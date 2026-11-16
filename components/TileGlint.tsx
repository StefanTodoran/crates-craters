import { memo, useMemo } from "react";
import { Animated, ImageSourcePropType } from "react-native";
import { graphics } from "../Theme";
import { useLoopClock } from "../util/hooks";

interface Props {
  tileSize: number;
  glintCount?: number;
  source?: ImageSourcePropType;
  sizeRange?: [number, number]; // Glint size as a fraction of the tile, smallest to largest.
  inset?: number; // Fraction of the tile on each side that glints stay out of.
}

// Memoized so board re-renders (every move) don't re-attach the glints' animated props.
export default memo(function TileGlint({
  tileSize, glintCount = 5, source = graphics.DIAMOND_GLINT, sizeRange = [0.1, 0.25], inset = 0.1,
}: Props) {
  const glintAnim = useLoopClock(1000, true);

  // Random integer between min (inclusive) and max (inclusive)
  function randomInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randomSample<T>(array: T[]): T { return array.splice(randomInt(0, array.length - 1), 1)[0]; }

  const glintEntities = useMemo(() => {
    const newGlintEntities: React.ReactNode[] = [];
    const interval = [...Array(glintCount * 2).keys()];

    const minPos = tileSize * inset;
    const posRange = tileSize * (1 - 2 * inset);

    const possibleX = interval.map(idx => idx / interval.length * posRange + minPos);
    const possibleY = interval.map(idx => idx / interval.length * posRange + minPos);

    for (let i = 0; i < glintCount; i++) {
      const size = tileSize * (sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]));

      const posX = randomSample(possibleX);
      const posY = randomSample(possibleY);

      const delay = Math.random();
      const phase = Animated.modulo(Animated.add(glintAnim, delay), 1);

      newGlintEntities.push(<Animated.Image
        key={i} source={source}
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
  }, [glintAnim, glintCount, source, tileSize, sizeRange[0], sizeRange[1], inset]);

  return (glintEntities);
});
