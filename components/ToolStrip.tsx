import { useContext, useEffect, useRef } from "react";
import { Image, ImageSourcePropType, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors, graphics, purpleTheme } from "../Theme";
import { diamondTool, eraserTool, getBombTool, getOneWayTool, metalCrateTool, spawnTool, Tool, tools, wallTool } from "../util/tools";
import { Direction, rotationToDirection } from "../util/types";
import ResponsivePressable from "./ResponsivePressable";
import SimpleButton from "./SimpleButton";
import SliderBar from "./SliderBar";

export enum OneWayMode {
  ONE_DIR = "One Direction",
  OPPOSITE_SIDES = "Opposite Sides",
  CORNER = "Corner",
}

const oneWayModeToIcon: Record<OneWayMode, ImageSourcePropType> = {
  [OneWayMode.ONE_DIR]: graphics.ONE_WAY_ONE_DIR,
  [OneWayMode.OPPOSITE_SIDES]: graphics.ONE_WAY_OPPOSITE_SIDES,
  [OneWayMode.CORNER]: graphics.ONE_WAY_CORNER,
};

/** Settings for the configurable tools. Owned by the editor so they persist between tools. */
export interface ToolOptions {
  fuseTimer: number,
  oneWayRotation: number,
  oneWayMode: OneWayMode,
}

export const defaultToolOptions: ToolOptions = {
  fuseTimer: 15,
  oneWayRotation: 0,
  oneWayMode: OneWayMode.ONE_DIR,
};

function blockedDirections(mode: OneWayMode, rotation: number): Direction[] {
  switch (mode) {
    case OneWayMode.ONE_DIR:
      return [rotationToDirection(rotation)];
    case OneWayMode.OPPOSITE_SIDES:
      return [rotationToDirection(rotation), rotationToDirection(rotation + 180)];
    case OneWayMode.CORNER:
      return [rotationToDirection(rotation), rotationToDirection(rotation - 90)];
  }
}

const basicTool = (label: string) => tools.find(tool => tool.label === label)!;

/**
 * Strip order, by label. The bomb and one-way tools are built from the options.
 * Diamonds are hidden for now (their tile and logic stay); add diamondTool.label after the metal crate to bring them back.
 */
const stripOrder = [
  wallTool.label, "One Way", "Crate", "Crater", "Ice Block", "Door", "Key", "Coin", "Flag",
  "Bomb", metalCrateTool.label, eraserTool.label, spawnTool.label,
];

/** The tool a strip label stands for, with the current options applied. */
export function resolveTool(label: string, options: ToolOptions): Tool {
  switch (label) {
    case "Bomb": return getBombTool(options.fuseTimer);
    case "One Way": return {
      ...getOneWayTool(blockedDirections(options.oneWayMode, options.oneWayRotation)),
      icon: oneWayModeToIcon[options.oneWayMode],
    };
    case wallTool.label: return wallTool;
    case spawnTool.label: return spawnTool;
    case metalCrateTool.label: return metalCrateTool;
    case diamondTool.label: return diamondTool;
    case eraserTool.label: return eraserTool;
    default: return basicTool(label);
  }
}

interface StripProps {
  selected: string, // Label of the current tool.
  options: ToolOptions,
  onSelect: (label: string) => void,
  width: number,
  inset?: number, // Space before the first tool and after the last.
}

const TILE_WIDTH = normalize(58);
const TILE_GAP = normalize(6);
export const STRIP_HEIGHT = normalize(62);

/** A scrollable row of tools under the board. One tap switches tools. */
export function ToolStrip({ selected, options, onSelect, width, inset = 2 }: StripProps) {
  const { darkMode } = useContext(GlobalContext);
  const scrollRef = useRef<ScrollView>(null);

  // Keep the selected tool in view, e.g. after a long press on a bomb selects the bomb tool.
  useEffect(() => {
    const index = stripOrder.indexOf(selected);
    const offset = inset + index * (TILE_WIDTH + TILE_GAP) - (width - TILE_WIDTH) / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, offset), animated: true });
  }, [selected, width, inset]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ width, flexGrow: 0 }}
      contentContainerStyle={[styles.stripContent, { paddingHorizontal: inset }]}
    >
      {stripOrder.map(label => {
        const tool = resolveTool(label, options);
        const theme = tool.theme || purpleTheme;
        const isSelected = label === selected;
        return (
          <ResponsivePressable
            key={label}
            onPress={() => onSelect(label)}
            pressedSize={0.94}
            customStyle={[styles.tile, {
              borderColor: isSelected ? theme.MAIN_COLOR : theme.MAIN_TRANSPARENT(0.6),
              borderWidth: isSelected ? 2 : 1,
              backgroundColor: isSelected ?
                theme.MAIN_TRANSPARENT(darkMode ? 0.35 : 0.3) :
                (darkMode ? theme.NEAR_BLACK : theme.OFF_WHITE),
            }]}
          >
            <Image
              source={tool.icon}
              style={[styles.tileIcon, label === "One Way" && { transform: [{ rotate: `${options.oneWayRotation}deg` }] }]}
            />
            <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[styles.tileLabel, { color: theme.MIDDLE_COLOR }]}>
              {label}
            </Text>
          </ResponsivePressable>
        );
      })}
    </ScrollView>
  );
}

interface OptionsProps {
  selected: string,
  options: ToolOptions,
  setOptions: (update: Partial<ToolOptions>) => void,
  width: number,
}

export const OPTIONS_HEIGHT = normalize(88);

const hints: Record<string, string> = {
  [spawnTool.label]: "Tap to move where the player starts.",
  [eraserTool.label]: "Tap or drag to erase any tile.",
};
const defaultHint = "Tap or drag to place. Tap a placed tile to remove it.";

/** Settings for the current tool (bomb fuse, one-way shape), or a short hint for the rest. */
export function ToolOptionsRow({ selected, options, setOptions, width }: OptionsProps) {
  const { darkMode } = useContext(GlobalContext);
  const { fuseTimer, oneWayRotation, oneWayMode } = options;

  if (selected === "Bomb") {
    return (
      <View style={[styles.options, { width }]}>
        <SliderBar
          label="Fuse Timer" value={fuseTimer} units={" turns"}
          minValue={1} maxValue={99} changeCallback={(value: number) => setOptions({ fuseTimer: value })}
          theme={colors.RED_THEME}
          width={width - 2 * STEPPER_ROOM}
          showSteppers
        />
        <Text allowFontScaling={false} style={styles.subHint}>Long-press a placed bomb to change its fuse.</Text>
      </View>
    );
  }

  if (selected === "One Way") {
    const theme = colors.BLUE_THEME;
    // Opposite sides only has two distinct rotations.
    const maxRotation = oneWayMode === OneWayMode.OPPOSITE_SIDES ? 90 : 270;
    return (
      <View style={[styles.options, { width }]}>
        <View style={styles.oneWayRow}>
          {Object.values(OneWayMode).map(mode => {
            const active = mode === oneWayMode;
            return (
              <ResponsivePressable
                key={mode}
                onPress={() => setOptions(mode === OneWayMode.OPPOSITE_SIDES ?
                  { oneWayMode: mode, oneWayRotation: oneWayRotation % 180 } :
                  { oneWayMode: mode })}
                pressedSize={0.94}
                customStyle={[styles.modeButton, {
                  borderColor: active ? theme.MAIN_COLOR : theme.MAIN_TRANSPARENT(0.6),
                  borderWidth: active ? 2 : 1,
                  backgroundColor: active ? theme.MAIN_TRANSPARENT(0.3) : (darkMode ? theme.NEAR_BLACK : theme.OFF_WHITE),
                }]}
              >
                <Image source={oneWayModeToIcon[mode]} style={[styles.modeIcon, { transform: [{ rotate: `${oneWayRotation}deg` }] }]} />
              </ResponsivePressable>
            );
          })}
          <View style={styles.rotateButton}>
            <SimpleButton
              text="Rotate"
              icon={graphics.ROTATE_ICON_WHITE}
              main
              theme={theme}
              onPress={() => setOptions({ oneWayRotation: oneWayRotation + 90 > maxRotation ? 0 : oneWayRotation + 90 })}
              height={MODE_SIZE}
              fillWidth
              centered
            />
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.subHint}>Tap a placed one-way tile to rotate it.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.options, { width, justifyContent: "center" }]}>
      <Text allowFontScaling={false} style={styles.hint}>{hints[selected] ?? defaultHint}</Text>
    </View>
  );
}

interface PlacedBombProps {
  fuse: number,
  setFuse: (fuse: number) => void,
  onDone: () => void,
  width: number,
}

/** Shown in place of the tool options while a placed bomb is being edited. */
export function PlacedBombRow({ fuse, setFuse, onDone, width }: PlacedBombProps) {
  const doneWidth = DONE_SIZE;
  return (
    <View style={[styles.options, { width }]}>
      <View style={styles.placedRow}>
        <SliderBar
          label="Placed Bomb" value={fuse} units={" turns"}
          minValue={1} maxValue={99} changeCallback={setFuse}
          theme={colors.RED_THEME}
          width={width - doneWidth - normalize(10) - 2 * STEPPER_ROOM}
          showSteppers
        />
        {/* Lined up with the slider bar, which sits under the slider's label row. */}
        <View style={styles.doneButton}>
          <SimpleButton icon={graphics.CHECK_ICON_WHITE} onPress={onDone} theme={colors.RED_THEME} main square />
        </View>
      </View>
    </View>
  );
}

const STEPPER_ROOM = normalize(32); // The slider's stepper arrows sit outside its width.
const MODE_SIZE = normalize(44);
const DONE_SIZE = normalize(50) + 2; // Square button: icon (30), padding (2 × 10) and border.

const styles = StyleSheet.create({
  stripContent: {
    gap: TILE_GAP,
    alignItems: "center",
    height: STRIP_HEIGHT,
  },
  tile: {
    width: TILE_WIDTH,
    height: STRIP_HEIGHT - normalize(4),
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  tileIcon: {
    width: normalize(28),
    height: normalize(28),
  },
  tileLabel: {
    marginTop: normalize(4),
    fontSize: normalize(10),
    fontFamily: "Montserrat-Medium",
    fontWeight: "bold",
  },
  options: {
    height: OPTIONS_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  placedRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    width: "100%",
    paddingLeft: STEPPER_ROOM,
  },
  doneButton: {
    marginLeft: STEPPER_ROOM + normalize(10),
    // Center on the slider bar: its center is this far above the slider's bottom edge
    // (bottom padding plus half the bar), and the button has a 5 vertical margin.
    // (iOS: the native slider is 40 tall, whatever its style says.)
    marginBottom: (Platform.OS === "ios" ? 10 + 40 / 2 : 15 + 3 / 2) - DONE_SIZE / 2 - normalize(5),
  },
  oneWayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: normalize(8),
    width: "100%",
    paddingTop: normalize(4),
  },
  modeButton: {
    width: MODE_SIZE,
    height: MODE_SIZE,
    borderRadius: normalize(10),
    alignItems: "center",
    justifyContent: "center",
  },
  modeIcon: {
    width: normalize(26),
    height: normalize(26),
  },
  rotateButton: {
    flex: 1,
  },
  hint: {
    color: colors.DIM_GRAY,
    fontSize: normalize(13),
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
  },
  subHint: {
    color: colors.DIM_GRAY,
    fontSize: normalize(11),
    fontFamily: "Montserrat-Regular",
    textAlign: "center",
    marginTop: normalize(4),
  },
});
