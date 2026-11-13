import { useContext } from "react";
import { ImageSourcePropType, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import TextStyles, { normalize } from "../TextStyles";
import { colors, graphics } from "../Theme";
import { diamondTool, getOneWayTool, metalCrateTool, spawnTool, Tool, tools } from "../util/tools";
import { Direction, rotationToDirection, TileType } from "../util/types";
import FilterChip from "./FilterChip";
import MenuButton from "./MenuButton";
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

/** Settings for the configurable tools. Owned by the editor so they persist while the picker is closed. */
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

interface Props {
  options: ToolOptions,
  setOptions: (update: Partial<ToolOptions>) => void,
  onSelect: (tool: Tool) => void,
}

const toolPairs: [Tool, Tool][] = [];
for (let i = 0; i < tools.length - 1; i += 2) toolPairs.push([tools[i], tools[i + 1]]);

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

/** The editor's scrollable list of tools, grouped by kind, with their settings. */
export default function ToolPicker({ options, setOptions, onSelect }: Props) {
  const { darkMode } = useContext(GlobalContext);
  const win = useWindowDimensions();
  const rowStyle = [styles.row, { width: win.width * 0.45 }];
  const { fuseTimer, oneWayRotation, oneWayMode } = options;

  const toolButton = (tool: Tool, onPress = () => onSelect(tool)) =>
    <MenuButton label={tool.label} icon={tool.icon} onPress={onPress} theme={tool.theme} fillWidth />;

  const bombTool: Tool = {
    label: "Bomb",
    tile: { id: TileType.BOMB, fuse: fuseTimer },
    icon: graphics.BOMB,
    theme: colors.RED_THEME,
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={TextStyles.subtitle(darkMode, colors.DIM_GRAY)}>
          Basic Tiles
        </Text>
        {toolPairs.map(([left, right], index) =>
          <View key={index} style={rowStyle}>
            {toolButton(left)}
            {toolButton(right)}
          </View>
        )}
        <View style={rowStyle}>
          {toolButton(spawnTool)}
        </View>

        <View style={styles.sectionGap} />
        <Text style={TextStyles.subtitle(darkMode, colors.RED_THEME.MAIN_COLOR)}>
          Bomb Tiles
        </Text>
        <View style={rowStyle}>
          <SliderBar
            label="Fuse Timer" value={fuseTimer} units={" turns"}
            minValue={1} maxValue={99} changeCallback={(value: number) => setOptions({ fuseTimer: value })}
            theme={colors.RED_THEME}
            showSteppers
          />
        </View>
        <View style={rowStyle}>
          {toolButton(bombTool)}
        </View>
        <View style={rowStyle}>
          {toolButton(metalCrateTool)}
          {toolButton(diamondTool)}
        </View>

        <View style={styles.sectionGap} />
        <Text style={TextStyles.subtitle(darkMode, colors.BLUE_THEME.MAIN_COLOR)}>
          One Way Tiles
        </Text>
        <View style={rowStyle}>
          <SliderBar
            label="Rotation" value={oneWayRotation} units={" deg"} stepSize={90}
            minValue={0} maxValue={oneWayMode === OneWayMode.OPPOSITE_SIDES ? 90 : 270}
            changeCallback={(value: number) => setOptions({ oneWayRotation: value })}
            theme={colors.BLUE_THEME}
            showSteppers
            stepperWrapAround
          />
        </View>
        <View style={styles.chipGap} />
        <View style={rowStyle}>
          {Object.values(OneWayMode).map(mode =>
            <FilterChip
              key={mode}
              text={mode}
              active={oneWayMode === mode}
              onPress={() => setOptions(mode === OneWayMode.OPPOSITE_SIDES ?
                // Opposite sides only has two distinct rotations.
                { oneWayMode: mode, oneWayRotation: Math.min(oneWayRotation, 90) } :
                { oneWayMode: mode })}
              theme={colors.BLUE_THEME}
            />
          )}
        </View>
        <View style={rowStyle}>
          <MenuButton
            label="One Way"
            icon={oneWayModeToIcon[oneWayMode]}
            iconRotation={oneWayRotation}
            onPress={() => onSelect(getOneWayTool(blockedDirections(oneWayMode, oneWayRotation)))}
            theme={colors.BLUE_THEME}
            fillWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    height: "100%",
    width: "100%",
  },
  content: {
    paddingTop: normalize(18),
    paddingBottom: normalize(24),
  },
  section: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: normalize(18),
  },
  sectionGap: {
    height: normalize(20),
  },
  chipGap: {
    height: normalize(10),
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
