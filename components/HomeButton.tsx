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
          fill={color}
          d="M14.9138 56.6154H6.75617C2.34698 56.6154 0.0961759 51.3232 3.15457 48.1472L46.3984 3.24012C48.3651 1.19773 51.6349 1.19774 53.6016 3.24012L67.7802 17.964V13.5433C67.7802 10.7818 70.0187 8.54327 72.7802 8.54327H80.5603C83.3218 8.54327 85.5603 10.7818 85.5603 13.5433V36.428L96.8454 48.1472C99.9038 51.3232 97.653 56.6154 93.2438 56.6154H85.0862V93.5C85.0862 96.2614 82.8476 98.5 80.0862 98.5H64.4828C61.7213 98.5 59.4828 96.2614 59.4828 93.5V73.9904C59.4828 71.229 57.2442 68.9904 54.4828 68.9904H45.5172C42.7558 68.9904 40.5172 71.229 40.5172 73.9904V93.5C40.5172 96.2614 38.2787 98.5 35.5172 98.5H19.9138C17.1524 98.5 14.9138 96.2614 14.9138 93.5V56.6154Z"
        />
      </Svg>
    </ResponsivePressable>
  );
}