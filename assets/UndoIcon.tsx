import Svg, { G, Path } from "react-native-svg";

interface Props {
  width: number,
  height: number,
  fillColor: string,
}

/** A U-turn arrow pointing back. Source: assets/svg/undo_icon.svg. */
export default function UndoIcon({ width, height, fillColor }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100">
      <G fill="none" stroke={fillColor} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M24 40 H60 A21 21 0 0 1 60 82 H38" />
        <Path d="M38 24 L22 40 L38 56" />
      </G>
    </Svg>
  );
}
