import { memo, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { graphics } from "../Theme";
import { fuseTip } from "../util/fuse";
import { useLoopClock } from "../util/hooks";

interface Props {
  tileSize: number,
  fuse: number,
}

const SPARK_COUNT = 5;
const SPREAD = 50 * Math.PI / 180; // Sparks fan this wide around the direction the fuse points.
const CYCLE = 900; // ms for one spark to fly out and fade.
const SPARK_ASPECT = 4 / 18; // fuse_spark.png is a thin streak, width / height.

/**
 * Embers flying off the burning end of a bomb's fuse: a flickering glow at the tip plus
 * a narrow fan of streaks (assets/svg/fuse_spark.svg) that shoot out along the fuse's
 * direction and fade at staggered phases. The tip follows the fuse as it burns down.
 * Native-driven and memoized, so other board re-renders don't rebuild it.
 */
export default memo(function FuseSpark({ tileSize, fuse }: Props) {
  const clock = useLoopClock(CYCLE, true);
  const tip = fuseTip(fuse);
  const tipX = tip.x / 100 * tileSize;
  const tipY = tip.y / 100 * tileSize;
  const tipAngle = tip.angle;

  const sparks = useMemo(() => [...Array(SPARK_COUNT).keys()].map(i => {
    // Fan the sparks around the fuse's direction, jittered so the fan doesn't look
    // regular, each starting a fraction of a cycle after the last.
    const angle = tipAngle + SPREAD * (i / (SPARK_COUNT - 1) - 0.5 + (Math.random() - 0.5) * 0.15);
    const length = tileSize * (0.1 + Math.random() * 0.06);
    const width = length * SPARK_ASPECT;
    const distance = tileSize * (0.08 + Math.random() * 0.07);
    const phase = Animated.modulo(Animated.add(clock, (i + Math.random() * 0.5) / SPARK_COUNT), 1);

    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const startOffset = length * 0.3;

    return (
      <Animated.Image
        key={i}
        source={graphics.FUSE_SPARK}
        style={{
          position: "absolute",
          width,
          height: length,
          left: tipX - width / 2,
          top: tipY - length / 2,
          opacity: phase.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, 1, 0.7, 0] }),
          transform: [
            { translateX: phase.interpolate({ inputRange: [0, 1], outputRange: [dx * startOffset, dx * (startOffset + distance)] }) },
            { translateY: phase.interpolate({ inputRange: [0, 1], outputRange: [dy * startOffset, dy * (startOffset + distance)] }) },
            { rotate: `${angle + Math.PI / 2}rad` }, // The streak art points up.
            { scale: phase.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.5, 1, 0.3] }) },
          ],
        }}
      />
    );
  }), [clock, tileSize, tipX, tipY, tipAngle]);

  const glowSize = tileSize * 0.09;
  const glow = useMemo(() => ({
    position: "absolute" as const,
    width: glowSize,
    height: glowSize,
    borderRadius: glowSize / 2,
    left: tipX - glowSize / 2,
    top: tipY - glowSize / 2,
    backgroundColor: "#FFD9A0",
    opacity: clock.interpolate({ inputRange: [0, 0.2, 0.45, 0.7, 1], outputRange: [0.9, 0.45, 1, 0.5, 0.9] }),
    transform: [{ scale: clock.interpolate({ inputRange: [0, 0.3, 0.55, 0.8, 1], outputRange: [1, 0.7, 1.15, 0.8, 1] }) }],
  }), [clock, glowSize, tipX, tipY]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: tileSize, height: tileSize }]}>
      <Animated.View style={glow} />
      {sparks}
    </View>
  );
});
