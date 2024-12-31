import { Dimensions } from "react-native";
import { Path, Svg } from "react-native-svg";
import ResponsivePressable from "./ResponsivePressable";
const win = Dimensions.get("window");

interface Props {
  color: string,
  onPress: () => void,
}

export default function HomeButton({ color, onPress }: Props) {
  return (
    <ResponsivePressable
      onPress={onPress}
      pressedSize={0.9}
      hitSlop={30}
    >
      <Svg
        width={win.width * 0.05}
        height={win.width * 0.05}
        viewBox="0 0 100 100"
        fill="none"
        // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          d="M49.033.36c1.526-.191 2.08 1.727.777 2.545C21.71 20.549 9.167 43.737 41.928 65.046c.78.508 1.834.405 2.492-.253l6.257-6.258c3.15-3.15 8.536-.918 8.536 3.536V95a5 5 0 01-5 5H21.284c-4.455 0-6.685-5.386-3.536-8.535l5.968-5.969c.781-.78.747-2.079-.02-2.874C-19.028 38.37 18.244 4.197 49.033.36zM95.58 95a5 5 0 01-5 5H73.314a5 5 0 01-5-5V77.734a5 5 0 015-5H90.58a5 5 0 015 5V95zm-9.082-8.643a4.541 4.541 0 00-9.082 0 4.54 4.54 0 109.082 0zm9.082-27.724a5 5 0 01-5 5H73.314a5 5 0 01-5-5V41.367a5 5 0 015-5H90.58a5 5 0 015 5v17.266zm-9.082-8.643a4.541 4.541 0 00-9.082 0 4.54 4.54 0 109.082 0zM95.58 5a5 5 0 00-5-5H73.314a5 5 0 00-5 5v17.266a5 5 0 005 5H90.58a5 5 0 005-5V5zm-9.082 8.643a4.541 4.541 0 01-9.082 0 4.54 4.54 0 119.082 0z"
          fill={color}
        />
      </Svg>
    </ResponsivePressable>
  );
}