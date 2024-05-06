import Svg, { Path } from "react-native-svg";

interface Props {
  width: number,
  height: number,
  fillColor: string,
}

function BackButton({
  width,
  height,
  fillColor,
}: Props) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        d="M38.089 24.725c1.947-1.666 4.95-.282 4.95 2.28v9.294c0 1.104.897 1.998 2.001 2.013 21.156.29 39.16 5.522 42.054 35.428.115 1.187-1.877 1.544-2.365.456-6.93-15.431-21.333-19.2-39.709-19.273a1.98 1.98 0 00-1.981 1.987v9.314c0 2.562-3.004 3.945-4.95 2.28l-22.924-19.61a3 3 0 010-4.56l22.924-19.61z"
        fill={fillColor}
      />
    </Svg>
  )
}

export default BackButton;
