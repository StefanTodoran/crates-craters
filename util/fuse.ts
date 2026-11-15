/**
 * The bomb's fuse (assets/svg/bomb.svg) is one stroked cubic Bézier from where it leaves
 * the cap to its free end. Bombs draw only the first part of it, via a dash, so it burns
 * down as the countdown drops; the fuse spark sits at wherever the drawn part ends.
 */

type Point = { x: number, y: number };

const P0 = { x: 75.7081, y: 28.8595 }; // Leaves the cap here.
const P1 = { x: 94.4221, y: 10.8229 };
const P2 = { x: 61.337, y: 23.8466 };
const P3 = { x: 68.4032, y: 8.02808 }; // Free end of a full-length fuse.

export const FUSE_PATH = `M${P0.x} ${P0.y}C${P1.x} ${P1.y} ${P2.x} ${P2.y} ${P3.x} ${P3.y}`;
export const FUSE_STROKE_WIDTH = 5;

const FULL_LENGTH_FUSE = 50; // Fuses this long or longer show the whole string.
const NUB_LENGTH = 2.5; // What's left (past the cap) with one move to go.

function bezier(t: number): Point {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return {
    x: a * P0.x + b * P1.x + c * P2.x + d * P3.x,
    y: a * P0.y + b * P1.y + c * P2.y + d * P3.y,
  };
}

function tangent(t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (P1.x - P0.x) + 6 * u * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x),
    y: 3 * u * u * (P1.y - P0.y) + 6 * u * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y),
  };
}

// Arc length lookup: cumulative length at evenly spaced t, for mapping length -> t.
const SAMPLES = 100;
const cumulative: number[] = [0];
for (let i = 1; i <= SAMPLES; i++) {
  const a = bezier((i - 1) / SAMPLES), b = bezier(i / SAMPLES);
  cumulative.push(cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
}
export const FUSE_TOTAL_LENGTH = cumulative[SAMPLES];

function tAtLength(length: number) {
  if (length <= 0) return 0;
  if (length >= FUSE_TOTAL_LENGTH) return 1;
  let i = 1;
  while (cumulative[i] < length) i++;
  const segment = (length - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
  return (i - 1 + segment) / SAMPLES;
}

/** How much of the fuse to draw for a countdown. Undefined (e.g. tool icons) is a full fuse. */
export function fuseLength(fuse: number | undefined) {
  if (fuse === undefined || fuse >= FULL_LENGTH_FUSE) return FUSE_TOTAL_LENGTH;
  const progress = Math.max(0, (fuse - 1) / (FULL_LENGTH_FUSE - 1));
  return NUB_LENGTH + progress * (FUSE_TOTAL_LENGTH - NUB_LENGTH);
}

/**
 * Where the burning end of the fuse is, in the bomb's 100x100 viewBox, and the direction
 * (radians, y down) the fuse points there. Includes the round line cap.
 */
export function fuseTip(fuse: number | undefined) {
  const t = tAtLength(fuseLength(fuse));
  const point = bezier(t);
  const dir = tangent(t);
  const angle = Math.atan2(dir.y, dir.x);
  const cap = FUSE_STROKE_WIDTH / 2;
  return { x: point.x + Math.cos(angle) * cap, y: point.y + Math.sin(angle) * cap, angle };
}
