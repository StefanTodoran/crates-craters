import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, G, LinearGradient, Mask, Path, Stop } from "react-native-svg";
import { Direction, FlatTile, TileType } from "../util/types";

interface Props {
  bgColor?: string,
  tileSize: number,
  tileData: FlatTile,
}

export function TileIcon({ bgColor, tileSize, tileData }: Props) {
  let Icon;
  const _bgColor = !!bgColor ? bgColor : "transparent";

  switch (tileData.id) {
    case TileType.CRATE:
      Icon = CrateIcon;
      break;
    case TileType.CRATER:
      Icon = CraterIcon;
      break;
    case TileType.COIN:
      Icon = CoinIcon;
      break;
    case TileType.FLAG:
      Icon = FlagIcon;
      break;
    case TileType.KEY:
      Icon = KeyIcon;
      break;
    case TileType.DOOR:
      Icon = DoorIcon;
      break;

    case TileType.ONEWAY:
      if (tileData.orientation === Direction.UP) Icon = OneWayUpIcon;
      if (tileData.orientation === Direction.RIGHT) Icon = OneWayRightIcon;
      if (tileData.orientation === Direction.DOWN) Icon = OneWayDownIcon;
      if (tileData.orientation === Direction.LEFT) Icon = OneWayLeftIcon;
      break;

    case TileType.BOMB:
      Icon = BombIcon;
      break;
    case TileType.EXPLOSION:
      Icon = ExplosionIcon;
      break;
    case TileType.LITTLE_EXPLOSION:
      Icon = LittleExplosionIcon;
      break;

    case TileType.SPAWN:
      Icon = SpawnIcon;
      break;
  }

  if (!Icon) return <></>;
  return <Icon tileSize={tileSize} styleProp={styles.tile(_bgColor, tileSize)}/>;
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function CrateIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path fill="#B19CD8" d="M20 20H80V80H20z" />
      <Path opacity={0.05} fill="#15101A" d="M20 20H80V80H20z" />
      <G opacity={0.4}>
        <Mask id="a" fill="#fff">
          <Path d="M20 15h60v15H20V15z" />
        </Mask>
        <Path d="M80 25H20v10h60V25z" fill="#BEA9DF" mask="url(#a)" />
      </G>
      <G opacity={0.4}>
        <Mask id="b" fill="#fff">
          <Path d="M20 30h60v15H20V30z" />
        </Mask>
        <Path d="M80 40H20v10h60V40z" fill="#BEA9DF" mask="url(#b)" />
      </G>
      <G opacity={0.4}>
        <Mask id="c" fill="#fff">
          <Path d="M20 45h60v15H20V45z" />
        </Mask>
        <Path d="M80 55H20v10h60V55z" fill="#BEA9DF" mask="url(#c)" />
      </G>
      <G opacity={0.4}>
        <Mask id="d" fill="#fff">
          <Path d="M20 60h60v15H20V60z" />
        </Mask>
        <Path d="M80 70H20v10h60V70z" fill="#BEA9DF" mask="url(#d)" />
      </G>
      <Path
        transform="rotate(-45 12.929 80.175)"
        fill="#BEA9DF"
        d="M12.929 80.1751H107.929V90.1751H12.929z"
      />
      <Path transform="rotate(45 20 13)" fill="#BEA9DF" d="M20 13H115V23H20z" />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M90 90V10H10v80h80zM80 80H20V20h60v60z"
        fill="#CCB7E5"
      />
      <Path opacity={0.1} d="M10 71l80-27.5V90H10V71z" fill="#15101A" />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function CraterIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path fill="#B19CD8" d="M10 10H90V90H10z" />
      <Path fill="url(#paint0_linear_544_2403)" d="M25 25H75V75H25z" />
      <Path
        opacity={0.35}
        d="M25 75h50l15 15H10l15-15z"
        fill="url(#paint1_linear_544_2403)"
      />
      <Path
        opacity={0.25}
        d="M25 25L10 10v80l15-15V25z"
        fill="url(#paint2_linear_544_2403)"
      />
      <Path
        opacity={0.25}
        d="M75 25l15-15v80L75 75V25z"
        fill="url(#paint3_linear_544_2403)"
      />
      <Path
        opacity={0.15}
        d="M25 25h50l15-15H10l15 15z"
        fill="url(#paint4_linear_544_2403)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_544_2403"
          x1={25}
          y1={75}
          x2={75}
          y2={25}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0.35} />
          <Stop offset={1} stopOpacity={0.2} />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_544_2403"
          x1={50}
          y1={90}
          x2={50}
          y2={75}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0} />
          <Stop offset={0.333333} stopOpacity={0.5} />
          <Stop offset={1} />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_544_2403"
          x1={10}
          y1={10}
          x2={25}
          y2={10}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0} />
          <Stop offset={0.333333} stopOpacity={0.5} />
          <Stop offset={1} />
        </LinearGradient>
        <LinearGradient
          id="paint3_linear_544_2403"
          x1={75}
          y1={10}
          x2={90}
          y2={10}
          gradientUnits="userSpaceOnUse"
        >
          <Stop />
          <Stop offset={0.666667} stopOpacity={0.5} />
          <Stop offset={1} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="paint4_linear_544_2403"
          x1={50}
          y1={10}
          x2={50}
          y2={25}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0} />
          <Stop offset={0.333333} stopOpacity={0.5} />
          <Stop offset={1} />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function CoinIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M40.147 16.61c6.876-3.565 22.13-1.577 22.13-1.577 4.826 1.907 9.733 5.196 13.109 9.432.707.892 2.142 3.202 2.697 4.344 1.85 3.795 2.886 7.925 3.238 12.918.68 9.718-1.793 19.056-7.376 27.818C68.407 78.24 61.49 83.848 53.35 86.228c-.924.272-2.887.701-3.812.842-2.984.445-5.826.383-8.395-.194-1.597-.358-6.294-1.581-6.983-1.814-4.073-1.392-7.765-4.178-10.86-8.189-.671-.875-2.226-3.402-2.68-4.356-2.186-4.622-3.203-9.546-3.216-15.567-.027-8.99 2.543-17.605 7.66-25.722 3.118-4.951 6.608-8.813 10.735-11.885.879-.652 3.44-2.26 4.348-2.732z"
        fill="#FFFDFC"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M38.78 17.403c.509-.308.958-.57 1.244-.718.342-.177.695-.346 1.058-.505-.326.133-.639.277-.935.43-.309.161-.808.453-1.367.793zM19.72 70.43c.274.705.574 1.4.9 2.088.218.459.69 1.28 1.197 2.108-.505-.825-.976-1.644-1.194-2.102a32.337 32.337 0 01-.903-2.094zm14.67 14.706c1.497.462 8.618 2.53 10.109 2.865 13.377 3.005 24.71-6.838 31.5-17.5 9.74-15.285 11.443-37.25-2.5-49-2.05-1.727-6.52-4.346-9.797-5.853.086.046.17.094.252.142 34.158 20.114 4.942 77.237-29.565 69.346z"
        fill="#F7CF68"
      />
      <G opacity={0.05} fill="#0E0A09">
        <Path d="M38.779 17.404c.51-.309.96-.57 1.245-.719.342-.177.695-.346 1.058-.506-.326.134-.639.278-.935.432-.309.16-.809.452-1.368.793zM19.719 70.424c.275.706.575 1.403.902 2.093.219.46.695 1.289 1.204 2.12-.508-.83-.982-1.654-1.2-2.114-.328-.692-.63-1.39-.906-2.099zM34.39 85.135c1.498.462 8.619 2.53 10.11 2.865 13.377 3.005 24.71-6.838 31.5-17.5 9.74-15.285 11.443-37.25-2.5-49-2.05-1.727-6.521-4.346-9.798-5.853.087.046.171.094.253.142 34.158 20.114 4.942 77.237-29.565 69.346z" />
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M40.024 16.685c-.905.471-3.458 2.074-4.334 2.724-4.113 3.064-7.59 6.918-10.694 11.86-5.093 8.105-7.645 16.71-7.604 25.693.022 6.017 1.044 10.94 3.232 15.561.454.954 2.01 3.482 2.68 4.357 3.094 4.012 6.782 6.803 10.848 8.2 34.61 8.209 64.04-49.13 29.803-69.291-4.497-2.648-16.654-2.875-23.931.896z"
        fill="#FFE7A8"
      />
      <Path
        d="M27.113 32.6h0c2.962-4.716 6.235-8.329 10.07-11.185.774-.575 3.211-2.104 3.994-2.511 3.18-1.648 7.62-2.495 11.901-2.575 4.37-.08 7.965.646 9.608 1.614 7.914 4.66 12.079 11.393 13.466 18.793 1.4 7.47-.019 15.738-3.546 23.278C65.491 75.225 50.5 86.312 34.85 82.675c-3.48-1.224-6.744-3.663-9.564-7.317-.57-.746-2.026-3.117-2.404-3.907-2.005-4.236-2.97-8.785-2.99-14.498v-.002c-.038-8.476 2.362-16.62 7.22-24.351z"
        stroke="#FFCA3F"
        strokeOpacity={0.5}
        strokeWidth={5}
      />
      <Path
        opacity={0.35}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M82.54 36.147C85.394 47.244 82.47 60.346 76 70.5 69.21 81.162 57.877 91.005 44.5 88c-1.491-.334-8.85-2.459-10.348-2.92-4.066-1.397-7.754-4.188-10.849-8.2-.347-.454-.932-1.35-1.478-2.243a54.389 54.389 0 01-.27-.445l-.03-.052c-.39-.652-.73-1.255-.904-1.623a32.135 32.135 0 01-2.177-6.147l59.792-31.804 4.304 1.581z"
        fill="#EFCA67"
      />
      <Path
        d="M49.68 54.65c-1.666 1.386-3.658 1.79-5.056 1.38-2.201-.642-4.187-3.665-2.631-7.715 1.556-4.05 5.23-5.42 7.431-4.777 1.273.372 2.67 1.031 3.156 2.733l4.327-2.257c-1.03-2.454-3.005-4.36-5.69-5.143-5.429-1.586-11.708 2.015-14.024 8.043-2.316 6.027.208 12.199 5.638 13.784 2.907.85 6.058.211 8.713-1.49L49.68 54.65z"
        fill="#FFF2F0"
      />
      <Path
        d="M51.531 53.892l-1.033-2.525-2.097 1.745c-1.26 1.047-2.577 1.186-3.216 1-.88-.258-2.54-1.919-1.325-5.08 1.243-3.236 3.956-3.88 5.004-3.574.54.158.946.334 1.238.551.254.19.444.423.554.81l.673 2.36 2.175-1.135 4.328-2.257 1.63-.85-.711-1.697c-1.246-2.97-3.668-5.324-6.973-6.29-6.632-1.936-13.844 2.46-16.451 9.246-2.632 6.848.13 14.432 6.943 16.422 3.556 1.038 7.3.23 10.353-1.726l1.403-.899-.63-1.542-1.865-4.559z"
        stroke="#FFCA3F"
        strokeOpacity={0.5}
        strokeWidth={4}
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function FlagIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M84 48c-9.211-4.058-14.27-3.945-23.125 0-9.03 3.941-14.094 3.716-23.125 0V20c9.422 4.012 14.424 3.383 23.125 0 9.031-3.264 14.094-3.315 23.125 0l-6.5 13L84 48z"
        fill="#FFE7A8"
      />
      <Path transform="rotate(90 38 13)" fill="#FFD873" d="M38 13H118V23H38z" />
      <Circle cx={33} cy={14} r={8} fill="#FFD873" />
      <Path
        d="M28 70.5l10-7V93H28V70.5zM39.856 10A8 8 0 0126 18l6.928-4 6.928-4z"
        fill="#EAC563"
        fillOpacity={0.75}
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function KeyIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M77.597 81.844c.093 2.21-.3 4.362-.897 4.82a1.362 1.362 0 01-.632.222c-.523.021-12.314-4.722-12.71-5.111-.178-.177-.872-1.118-1.542-2.099l-.018-.025c-.74-1.083-1.094-1.6-1.178-2.158-.077-.51.072-1.053.356-2.093l.004-.013c.215-.795.356-1.495.315-1.533-.054-.037-1.067-.14-2.262-.208-1.195-.082-2.314-.207-2.5-.278-.387-.167-2.851-3.63-2.994-4.226-.078-.298.065-.933.55-2.5.357-1.14.63-2.121.576-2.159-.04-.037-1.069-.192-2.28-.351-1.212-.16-2.347-.35-2.52-.408-.572-.225-.672-.732-.65-3.314l.031-2.36-.879-1.274c-.474-.7-.947-1.35-1.03-1.438l-8.771-12.843L50.6 38.843l6.325 9.065c-.02.021 1.177 1.751 2.663 3.834 7.103 10.02 13.525 19.451 15.917 23.375 1.31 2.147 1.992 4.36 2.092 6.727z"
        fill="#8AD092"
      />
      <Path
        d="M44.626 52.962c-.105.077-.227.167-.367.273l.367-.273z"
        fill="#AADFAB"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M54.05 39.366c-.001-.026.129-.36.297-.707.959-2.122 1.333-4.116 1.307-6.906-.025-2.436-.288-4.023-.957-5.896-1.853-5.112-6.151-9.22-11.313-10.815-2.325-.65-3.614-.84-5.887-.767-2.967.135-5.298.768-7.755 2.127-2.803 1.543-5.171 3.776-6.625 6.26-.94 1.76-1.397 2.752-1.943 4.547-.536 1.87-.664 3.5-.478 6.047.172 2.508.488 3.806 1.44 5.876 2.814 6.147 8.944 10.193 15.534 10.25l1.598.012.137.554c.068.31.23 1.366.37 2.35.127.997.327 1.958.425 2.156.263.467.762.66 1.386.519.102-.023.184-.042.267-.07.324-.108.65-.353 2.268-1.565l.138-.103c.14-.106.262-.196.367-.273 3.608-3.369 5.85-5.075 10.36-7.695.027-.025.626-.41 1.345-.852 1.418-.887 1.897-1.35 1.994-1.91.132-.825-.561-1.434-2.97-2.574l-1.305-.565zM31.734 28.832c.253.422 1.238 1.115 1.861 1.286 2.361.702 4.694-1.123 4.589-3.608-.064-1.52-1.146-2.818-2.418-3.477-.603-.303-2.23.091-2.882.472-.678.395-1.39 1.21-1.624 1.861-.106.28-.175.519-.148.53-.2.547-.153 1.887.622 2.936z"
        fill="#AADFAB"
      />
      <Path
        d="M56.05 50.665l18.29 26.64c.676 1.65 1.02 2.574.585 4.21l-8.291-8.719-13.987-20.37 3.403-1.76z"
        fill="#AADFAB"
      />
      <Path
        opacity={0.05}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30.267 47.57a16.806 16.806 0 007.403 1.811l1.598.013.137.553c.068.31.23 1.367.37 2.351.127.997.327 1.958.425 2.156.263.467.762.66 1.386.519.102-.023.184-.042.267-.07.324-.108.65-.353 2.268-1.565l.138-.103.367-.273c3.608-3.369 5.85-5.075 10.36-7.695.027-.025.626-.41 1.345-.852 1.418-.887 1.897-1.35 1.994-1.91.132-.825-.561-1.434-2.97-2.574l-1.305-.565c-.001-.026.129-.36.297-.707.959-2.122 1.333-4.116 1.307-6.906-.025-2.436-.288-4.023-.957-5.896a17.187 17.187 0 00-1.371-2.899l-23.06 24.613z"
        fill="#0E160E"
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function DoorIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path fill="#EEFCEE" d="M20 10H80V90H20z" />
      <Path fill="#A9DFAB" fillOpacity={0.5} d="M20 10H80V90H20z" />
      <Path
        opacity={0.25}
        d="M20 63l60-32v59H20V63z"
        fill="#A9DFAB"
        fillOpacity={0.5}
      />
      <Path
        opacity={0.4}
        d="M72 56v28H54V56h18zM54 19v30h18V36c0-7-5.5-17-18-17zM46 56v28H28V56h18zM46 19v30H28V36c0-7 5.5-17 18-17z"
        fill="#9BD99D"
      />
      <Path
        opacity={0.45}
        d="M72 43l-18-8v14h18v-6zM28 43l18-8v14H28v-6z"
        fill="#9DD8A4"
        fillOpacity={0.5}
      />
      <G opacity={0.45} fill="#9DD8A4" fillOpacity={0.5}>
        <Path d="M28 84V71.312l18-6.187V84H28zM54 84V65.125l18 6.188V84H54z" />
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 29.999C10-10.5 90-9 90 29.999v70H10v-70zm70 0c-.164 26.411 0 60 0 60H20v-60c.166-25.92 60.164-26.412 60 0z"
        fill="#AADFAB"
      />
      <Path
        d="M42.127 69.717l-.342 1.783h16.43l-.342-1.783-2.989-15.567a9.5 9.5 0 10-9.768 0l-2.99 15.567z"
        fill="#8AD092"
        stroke="#EEFCEE"
        strokeWidth={3}
      />
      <Path
        opacity={0.075}
        d="M90 100V43.5L53.706 55.976 56.4 70H43.6l2.185-11.301L10 71v29h80z"
        fill="#0E160E"
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function OneWayUpIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M46 93.5h8v-63l19 16 6-6-25-22-4-3.5-4 3.5-25 22 6 6 19-16v63z"
        fill="#81B5FE"
        fillOpacity={0.5}
      />
      <Path
        transform="rotate(-180 100 10)"
        fill="#81B5FE"
        fillOpacity={0.5}
        d="M100 10H200V19.99999H100z"
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function OneWayLeftIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        transform="rotate(-180 10 100)"
        fill="#81B5FE"
        fillOpacity={0.5}
        d="M10 100H20V200H10z"
      />
      <Path
        d="M93.5 54v-8h-63l16-19-6-6-22 25-3.5 4 3.5 4 22 25 6-6-16-19h63z"
        fill="#81B5FE"
        fillOpacity={0.5}
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function OneWayRightIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        transform="matrix(1 0 0 -1 90.13 100)"
        fill="#81B5FE"
        fillOpacity={0.5}
        d="M0 0H10V100H0z"
      />
      <Path
        d="M6.5 46v8h63l-16 19 6 6 22-25 3.5-4-3.5-4-22-25-6 6 16 19h-63z"
        fill="#81B5FE"
        fillOpacity={0.5}
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function OneWayDownIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        transform="matrix(1 0 0 -1 0 100)"
        fill="#81B5FE"
        fillOpacity={0.5}
        d="M0 0H100V9.99999H0z"
      />
      <Path
        d="M54 6.5h-8v63l-19-16-6 6 25 22 4 3.5 4-3.5 25-22-6-6-19 16v-63z"
        fill="#81B5FE"
        fillOpacity={0.5}
      />
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function ExplosionIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M60.755 6.703c-.184.936-1.015 5.327-1.86 9.754-6.114 32.023-6.677 34.978-6.714 35.027-.036.024-1.7-4.512-4.916-13.427-.685-1.898-1.272-3.467-1.297-3.503-.037-.024-.269 4.196-.526 9.401-.257 5.194-.489 9.475-.501 9.487-.025.024-.11-.085-.184-.243-.734-1.423-25.244-46.91-25.28-46.885-.025.036 8.463 53.708 8.573 54.109.025.122.012.219-.024.207-.05 0-3.474-3.612-7.608-8.027a4235.47 4235.47 0 00-8.708-9.256l-1.186-1.252 1.712 4.5c.93 2.468 3.78 9.973 6.336 16.662 2.544 6.689 4.61 12.174 4.598 12.198-.036.037-15.79-11.006-17.061-11.943-.147-.11-.147-.085.012.17.11.17 4.709 7.286 10.237 15.811L26.399 95l3.4-.377 3.4-.377-.036-.292c-.013-.158-.991-4.853-2.177-10.435-1.175-5.57-2.128-10.156-2.104-10.168.024-.024 2.324 2.068 5.112 4.646 2.838 2.615 5.088 4.61 5.125 4.525.037-.134-.086-4.525-.355-12.576a637.034 637.034 0 01-.183-6.385c-.037-1.703-.098-3.235-.135-3.406-.049-.206-.024-.267.061-.182.074.073 2.361 4.038 5.076 8.805 2.728 4.78 4.978 8.611 5.015 8.514.024-.097.379-2.579.795-5.522.416-2.943.782-5.485.831-5.655.062-.292.074-.28.233.17 1.076 3.029 2.91 7.723 2.972 7.626.049-.073.966-2.92 2.03-6.325 1.884-5.959 1.957-6.178 2.043-5.63.06.316.293 3.612.526 7.321.452 7.042.66 9.997.709 10.058.024.012 3.143-2.59 6.935-5.79 3.803-3.198 6.922-5.8 6.947-5.788.012.012-.306 1.058-.698 2.323-.403 1.265-1.59 5.035-2.641 8.38-2.716 8.598-2.85 9.06-2.777 9.06.037 0 1.64-.51 3.56-1.143 4.353-1.435 5.76-1.885 5.76-1.837 0 .013-1.186 1.302-2.63 2.87-1.443 1.57-2.58 2.859-2.531 2.871.049.012 2.262.304 4.916.645 2.654.328 6.263.79 8.011 1.021 1.75.22 3.193.402 3.205.39.024-.013-1.59-1.326-3.572-2.92-1.993-1.593-3.644-2.943-3.68-3.004-.038-.06 2.384-2.797 5.38-6.093 2.985-3.296 5.419-6.008 5.394-6.032-.024-.025-3.388 1.386-7.473 3.126-4.085 1.739-7.448 3.162-7.46 3.137-.012-.012.636-1.775 1.443-3.916 3.253-8.684 8.537-22.755 10.31-27.486 3.682-9.827 6.116-16.31 6.483-17.259.232-.595.403-1.106.379-1.13-.025-.025-5.565 6.3-12.317 14.059-6.75 7.771-12.291 14.072-12.316 14.01-.012-.048.306-3.38.71-7.382.415-4.001.782-7.638.82-8.075l.06-.79L69.5 44.77c-.795 1.204-2.715 4.123-4.257 6.47-1.553 2.36-2.85 4.294-2.898 4.294-.061 0-.098-.694-.098-1.557 0-.851-.061-3.624-.122-6.166l-.245-10.095a8599.34 8599.34 0 01-.245-10.338c-.06-2.675-.17-7.467-.256-10.642-.074-3.174-.172-7.114-.208-8.756L61.085 5l-.33 1.703z"
        fill="url(#paint0_linear_542_2037)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_542_2037"
          x1={94.0518}
          y1={82.9891}
          x2={-7.12964}
          y2={43.5004}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FB6C6C" />
          <Stop offset={1} stopColor="#F7B79B" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function LittleExplosionIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M38.852 34.03l-.623 32.47L18.5 54l12.574 26.337-11.26-.662L34.33 94.041l-5.64-9.7 9.54 1.022L34.329 71 44.5 80.337 42.5 71l5 7.5 6-17.182V77.5l9.685-9.346L59.667 82.5l7.724-2.163L65.5 90.5l1.891 2.47L77 74.714l-9.63.249 8.963-22.988L59.667 64 58.11 43.457l-8.296 17.944-10.963-27.37z"
        fill="url(#paint0_linear_542_2035)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_542_2035"
          x1={77.0345}
          y1={42.0392}
          x2={9.71805}
          y2={68.2317}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FB6C6C" />
          <Stop offset={1} stopColor="#F7B79B" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function BombIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M74.2 26.116l.884.698.511.457.716.596c1.097.912 3.728 3.575 4.397 4.46.678.885 1.292 1.853 1.292 2.03 0 .093-4.852 5.764-6.526 7.617-.174.193-.167.205.244.904l.017.028c.66 1.117 1.924 3.761 2.389 5.028 1.366 3.688 2.017 7.338 2.017 11.37 0 2.328-.093 3.483-.428 5.522-.883 5.345-3.04 10.215-6.507 14.713-.985 1.276-3.913 4.255-5.15 5.224-3.235 2.56-6.553 4.367-10.225 5.578-8.274 2.738-17.253 2.067-24.96-1.863A32.633 32.633 0 0118.51 74.091c-5.42-10.68-4.508-23.606 2.362-33.42 4.88-6.956 12.326-11.79 20.618-13.363 5-.95 10.355-.69 15.291.736 1.153.335 3.31 1.126 3.942 1.452l.437.214 3.355-3.855L67.87 22l.437.186c1.05.447 3.681 2.207 5.894 3.93z"
        fill="url(#paint0_linear_542_2262)"
      />
      <Path
        d="M66 6.5l-1-3 2 3L68 3v4l3-5-2 5.5L72.5 5l-3 3.5-1.5 1 1 .5c-1.772 8.028 30.058-1.578 8 20l-4-3c17.37-14.474-11.722-2.209-7.5-18h1L66 6.5z"
        fill="#FB6C6C"
        fillOpacity={0.5}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.084 26.814l-.883-.698c-2.213-1.723-4.843-3.483-5.894-3.93L67.87 22l-3.356 3.855-3.355 3.855c6.836 3.86 9.79 6.713 14.208 12.468-.005-.077.036-.125.107-.204C77.147 40.121 82 34.45 82 34.357c0-.177-.614-1.145-1.292-2.03-.67-.885-3.3-3.548-4.397-4.46l-.716-.596-.511-.457z"
        fill="#F79B9B"
      />
      <Path
        opacity={0.075}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M76.047 43.464c.69 1.28 1.678 3.383 2.077 4.47 1.366 3.688 2.017 7.338 2.017 11.37 0 2.328-.093 3.483-.428 5.522-.883 5.345-3.04 10.215-6.507 14.713-.985 1.276-3.913 4.255-5.15 5.224-3.235 2.56-6.553 4.367-10.225 5.578-8.274 2.738-17.253 2.067-24.96-1.863a32.618 32.618 0 01-13.918-13.542c27.71 8.023 57.432-4.464 57.094-31.473z"
        fill="#0E0A09"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_542_2262"
          x1={82}
          y1={92}
          x2={0.462505}
          y2={50.7032}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0.152248} stopColor="#FB6C6C" />
          <Stop offset={0.823245} stopColor="#F79B9B" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

interface IconProps {
  tileSize: number,
  styleProp: any,
}

export function SpawnIcon({ tileSize, styleProp }: IconProps) {
  return (
    <Svg
      width={tileSize}
      height={tileSize}
      viewBox="0 0 100 100"
      fill="none"
      // @ts-expect-error Known issue with react-native-svg: https://github.com/software-mansion/react-native-svg/issues/1638
      xmlns="http://www.w3.org/2000/svg"
      style={styleProp}
    >
      <Path
        d="M48.66 52.88l-10 17.32-8.66-5 10.313-17.237 7.382-11.48.965 16.397zM50.836 74.588l-5.177 19.319L36 91.319 41.5 72l4.16-13 5.176 15.588zM51.859 52.88l10 17.32 8.66-5-10.313-17.237-7.382-11.48-.965 16.397z"
        fill="#CCB7E5"
      />
      <Path
        d="M49.55 74.838l5.177 19.319 9.659-2.588-5.5-19.32-4.16-13-5.176 15.59z"
        fill="#CCB7E5"
      />
      <Path transform="rotate(90 55 30)" fill="#CCB7E5" d="M55 30H100V40H55z" />
      <Circle cx={49.5} cy={21.5} r={17.5} fill="#CCB7E5" />
      <Path
        opacity={0.1}
        d="M64.61 12.5c4.833 8.37 1.966 19.073-6.405 23.905C49.835 41.238 39.133 38.37 34.3 30l15.155-8.75 15.156-8.75z"
        fill="#15101A"
      />
    </Svg>
  );
}

const styles = StyleSheet.create<any>({
  tile: (bgColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
});