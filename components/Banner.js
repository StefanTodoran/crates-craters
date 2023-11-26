import React, { useContext } from "react";
import { Dimensions } from "react-native";
import GlobalContext from "../GlobalContext";
import { Path, Svg, G, Circle, Defs, Mask, LinearGradient, Stop } from "react-native-svg";

const win = Dimensions.get("window");
const width = 687;
const height = 149;

// Returns a list [width, height] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(widthPercent) {
  const percent = widthPercent / 100;
  const ratio = win.width * percent / width;
  return [
    Math.round(win.width * percent), 
    Math.round(ratio * height),
  ];
}

export default function Banner({ widthPercent }) {
  const { darkMode } = useContext(GlobalContext);

  return (
    <Svg
      width={sizeFromWidthPercent(widthPercent)[0]}
      height={sizeFromWidthPercent(widthPercent)[1]}
      viewBox="0 0 687 149"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        d="M350.19 41.417l-7.486 7.22-3.61-3.743 7.63-7.133 5.339-4.677-1.873 8.333zM348.159 52.578l-5.362 8.912-4.456-2.681 5.524-8.865 3.946-5.9.348 8.535zM351.788 41.876l2.51 10.093 5.046-1.255-2.678-10.096-2.04-6.798-2.838 8.056z"
        fill="#CCB7E5"
      />
      <Path
        d="M347.48 52.519l-.188 10.398 5.199.094.027-10.445-.212-7.094-4.826 7.047z"
        fill="#CCB7E5"
      />
      <Path
        transform="rotate(106.036 356.645 30.893)"
        fill="#CCB7E5"
        d="M356.645 30.8931H380.04499999999996V36.0931H356.645z"
      />
      <Circle
        cx={355.117}
        cy={25.855}
        r={9.1}
        transform="rotate(16.036 355.117 25.855)"
        fill="#CCB7E5"
      />
      <Path
        opacity={0.1}
        d="M363.962 23.528a9.1 9.1 0 01-6.635 11.027A9.1 9.1 0 01346.3 27.92l8.831-2.196 8.831-2.196z"
        fill="#15101A"
      />
      <Path
        transform="rotate(-26.813 16.652 41.657)"
        fill="#F9F0FC"
        d="M16.6519 41.6574H61.334V101.2336H16.6519z"
      />
      <Path
        transform="rotate(-26.813 16.652 41.657)"
        fill="#BEA9DF"
        fillOpacity={0.5}
        d="M16.6519 41.6574H61.334V101.2336H16.6519z"
      />
      <Path
        opacity={0.25}
        d="M34.455 76.883l29.13-41.423 19.818 39.213-39.878 20.155-9.07-17.945z"
        fill="#BEA9DF"
        fillOpacity={0.5}
      />
      <G fill="#BEA9DF">
        <Path
          opacity={0.4}
          d="M66.665 54.763l9.406 18.61-11.964 6.046-9.405-18.61 11.963-6.046zM42.273 36.218l10.077 19.94 11.964-6.047-4.367-8.64c-2.352-4.653-9.366-9.452-17.674-5.253zM49.385 63.497l9.405 18.61-11.963 6.046-9.406-18.61 11.964-6.046zM36.956 38.905l10.077 19.94L35.07 64.89l-4.367-8.64c-2.352-4.653-2.055-13.147 6.253-17.346z"
        />
      </G>
      <G fill="#B19CD8" fillOpacity={0.5}>
        <Path
          opacity={0.45}
          d="M62.298 46.123l-14.65.73 4.702 9.304 11.964-6.046-2.016-3.988zM33.054 60.903L42.33 49.54l4.703 9.305-11.963 6.047-2.016-3.988z"
        />
        <G opacity={0.45}>
          <Path d="M46.827 88.153l-4.262-8.432 9.885-10.16 6.34 12.546-11.963 6.046zM64.107 79.42l-6.34-12.546 14.042-1.934 4.262 8.433-11.964 6.046z" />
        </G>
      </G>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.723 58.308C3.12 31.392 56.794 5.515 69.894 31.435L93.408 77.96l-53.17 26.873-3.36-6.647-20.155-39.878zm46.525-23.514c8.763 17.61 20.155 39.878 20.155 39.878L43.525 94.827 23.37 54.95c-8.596-17.283 31.115-37.764 39.878-20.155z"
        fill="#CCB7E5"
      />
      <Path
        d="M51.05 74.02l.499 1.746 1.62-.82 8.507-4.299 1.62-.819-1.11-1.437-7.055-9.135a7.458 7.458 0 10-7.252 3.665l3.17 11.099z"
        fill="#B19CD8"
        stroke="#F9F0FC"
        strokeWidth={3}
      />
      <Path
        opacity={0.075}
        d="M93.409 77.96L74.429 40.41 54.5 60.892 61 69.308l-8.507 4.3-2.344-8.246L30.496 85.56l9.742 19.275 53.17-26.873z"
        fill="#15101A"
      />
      <G>
        <Path
          d="M629.7 92.672l31.741-6.15.699 3.607.978 5.05-3.607.699-.978-5.05-5.771 1.118.978 5.05-3.607.699-.978-5.05-18.757 3.634-.698-3.607z"
          fill="#CCB7E5"
        />
        <Circle
          cx={614.679}
          cy={98.2012}
          r={14.0333}
          transform="rotate(-10.964 614.679 98.201)"
          stroke="#CCB7E5"
          strokeWidth={5}
        />
      </G>
      <G>
        <Path
          d="M139.288 120.776c-.651 2.231-4.241 5.13-4.241 5.13-1.413.653-3.143 1.037-4.762.892a10.01 10.01 0 01-1.502-.314c-1.206-.384-2.317-1.015-3.474-1.972-2.25-1.865-3.765-4.336-4.51-7.363-.741-3.002-.525-5.665.644-7.925.132-.256.446-.772.607-1.001.521-.74 1.123-1.344 1.78-1.782a47.699 47.699 0 011.84-1.14c1.146-.596 2.515-.82 4.027-.662.329.036 1.199.222 1.5.321 1.456.483 2.736 1.282 4.045 2.526 1.957 1.856 3.295 4.198 3.997 6.989.429 1.702.544 3.26.356 4.792-.04.325-.222 1.214-.307 1.509z"
          fill="#FEFAFF"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M139.399 120.315a7.85 7.85 0 01-.102.419 5.67 5.67 0 01-.109.335c.038-.099.072-.196.1-.293.029-.1.069-.269.111-.461zm-7.574-15.123a10.222 10.222 0 00-.628-.232 8.282 8.282 0 00-.002-.001c.214.071.424.149.63.233zm-6.218.144c-.411.229-2.334 1.346-2.716 1.601-3.422 2.281-3.633 6.779-2.725 10.461 1.301 5.279 5.715 10.198 11.153 9.605.799-.087 2.294-.515 3.299-.914a2.616 2.616 0 01-.083.025c-11.439 3.248-17.787-14.923-8.928-20.778z"
          fill="#B19CD8"
        />
        <G opacity={0.05} fill="#15101A">
          <Path d="M139.399 120.315a7.85 7.85 0 01-.102.419 5.67 5.67 0 01-.109.335c.038-.099.072-.196.1-.293.029-.1.069-.269.111-.461zM131.838 105.198a9.449 9.449 0 00-.641-.238 8.51 8.51 0 00-.002-.001c.218.073.432.152.643.239zM125.607 105.336c-.411.229-2.334 1.346-2.716 1.601-3.422 2.281-3.633 6.779-2.725 10.461 1.301 5.279 5.715 10.198 11.153 9.605.799-.087 2.294-.515 3.3-.914l-.084.025c-11.439 3.248-17.787-14.923-8.928-20.778z" />
        </G>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M139.297 120.734c.085-.294.266-1.18.306-1.505.187-1.527.071-3.08-.359-4.777-.704-2.784-2.044-5.12-4.002-6.971-1.311-1.242-2.591-2.039-4.047-2.522a11.845 11.845 0 00-1.5-.32c-1.512-.16-2.882.063-4.027.656-8.949 5.812-2.599 24.075 8.867 20.819 1.506-.428 4.073-3.019 4.762-5.38z"
          fill="#BEA9DF"
          fillOpacity={0.5}
        />
        <Path
          d="M136.82 115.066v-.001c-.596-2.357-1.706-4.265-3.296-5.768l-.001-.001c-1.088-1.031-2.057-1.612-3.105-1.96l-.009-.003.786-2.373-.78 2.375 6.405 7.731zm0 0c.364 1.437.446 2.676.302 3.856m-.302-3.856l.302 3.856m0 0l-.002.014-.006.043a14.063 14.063 0 01-.097.515c-.027.134-.055.263-.079.37l-.031.131-.011.044c-.202.685-.754 1.591-1.514 2.418a7.53 7.53 0 01-1.043.953c-.286.21-.451.282-.483.297l-.004.002c-2.145.609-3.949.214-5.435-.753-1.545-1.005-2.84-2.701-3.641-4.758-1.652-4.24-.85-8.697 2.146-10.734.624-.296 1.45-.449 2.501-.34l.01.001 7.689 11.797z"
          stroke="#B19CD8"
          strokeOpacity={0.5}
          strokeWidth={5}
        />
        <Path
          opacity={0.75}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M126.268 125.932c-3-1.679-5.238-5.027-6.102-8.534-.908-3.682-.697-8.18 2.725-10.461.382-.255 2.367-1.412 2.777-1.642 1.145-.593 2.515-.816 4.027-.656.17.018.486.077.793.143l.053.012c.267.058.52.121.656.166a9.449 9.449 0 011.785.801l-5.48 19.564-1.234.607z"
          fill="#B19CD8"
          fillOpacity={0.5}
        />
        <Path
          d="M129.057 114.968c.044-.649.369-1.165.747-1.384.596-.344 1.663-.149 2.22 1.027.557 1.176.093 2.258-.502 2.602-.345.2-.847.218-1.317-.029l.07.148-.406 1.407c.746.284 1.568.25 2.294-.17 1.469-.85 1.988-2.959 1.159-4.71-.829-1.75-2.691-2.481-4.159-1.631-.787.456-1.301 1.271-1.481 2.2l1.375.54z"
          fill="#F9F0FC"
        />
      </G>
      <G>
        <Path
          d="M93.475 90.471c3.507-1.818 11.286-.804 11.286-.804 2.461.972 4.964 2.65 6.686 4.81.36.455 1.092 1.633 1.376 2.216.943 1.935 1.471 4.041 1.651 6.588.347 4.956-.915 9.719-3.762 14.187-2.824 4.435-6.352 7.295-10.503 8.508-.472.139-1.473.358-1.944.43-1.522.227-2.972.195-4.282-.099-.814-.183-3.21-.807-3.561-.925-2.078-.71-3.96-2.131-5.54-4.177-.341-.446-1.134-1.735-1.366-2.221-1.115-2.357-1.633-4.869-1.64-7.94-.014-4.584 1.297-8.978 3.906-13.118 1.59-2.525 3.37-4.494 5.476-6.061.448-.332 1.754-1.153 2.217-1.394z"
          fill="#FEFAFF"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M92.777 90.876c.26-.157.49-.29.635-.367.175-.09.355-.176.54-.258a5.9 5.9 0 00-.477.22c-.158.082-.413.231-.698.405zm-9.717 27.048c.14.358.291.71.456 1.06a14.12 14.12 0 00.002.003 16.47 16.47 0 01-.458-1.063zm7.48 7.495c.763.235 4.394 1.29 5.155 1.461 6.822 1.532 12.602-3.487 16.065-8.925 4.967-7.796 5.836-18.997-1.275-24.99-1.045-.88-3.326-2.216-4.997-2.985l.129.072c17.421 10.259 2.52 39.391-15.078 35.367z"
          fill="#B19CD8"
        />
        <G opacity={0.05} fill="#15101A">
          <Path d="M92.777 90.876c.26-.157.49-.29.635-.367.175-.09.355-.176.54-.258a5.9 5.9 0 00-.477.22c-.158.082-.412.231-.698.405zM83.057 117.916c.14.36.293.716.46 1.068a14.37 14.37 0 00.001.003c-.167-.353-.32-.71-.461-1.071zM90.54 125.419c.763.235 4.394 1.29 5.155 1.461 6.822 1.532 12.602-3.487 16.065-8.925 4.967-7.796 5.836-18.997-1.275-24.99-1.045-.88-3.326-2.216-4.997-2.985l.129.072c17.421 10.259 2.52 39.391-15.078 35.367z" />
        </G>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M93.412 90.51c-.461.24-1.764 1.057-2.21 1.389-2.098 1.562-3.87 3.528-5.454 6.049-2.598 4.132-3.899 8.521-3.878 13.103.011 3.068.532 5.579 1.648 7.936.232.486 1.025 1.775 1.367 2.222 1.578 2.046 3.459 3.469 5.533 4.182 17.651 4.186 32.66-25.057 15.199-35.339-2.293-1.35-8.494-1.466-12.205.457z"
          fill="#BEA9DF"
          fillOpacity={0.5}
        />
        <Path
          d="M87.865 99.278h0c1.44-2.295 3.01-4.019 4.829-5.373.346-.257 1.53-1 1.87-1.177 1.399-.724 3.457-1.137 5.529-1.175 2.16-.04 3.714.335 4.255.654 3.72 2.19 5.641 5.314 6.285 8.754.658 3.509 0 7.465-1.713 11.127-3.486 7.452-10.63 12.523-17.802 10.899-1.492-.54-2.95-1.615-4.25-3.301-.244-.319-.938-1.45-1.092-1.773-.932-1.97-1.396-4.107-1.406-6.871v-.002c-.019-4.075 1.132-8.002 3.495-11.762z"
          stroke="#B19CD8"
          strokeOpacity={0.5}
          strokeWidth={5}
        />
        <Path
          opacity={0.75}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M115.095 100.435c1.456 5.659-.035 12.341-3.335 17.52-3.463 5.438-9.243 10.457-16.065 8.925-.76-.171-4.513-1.254-5.277-1.489-2.074-.713-3.955-2.136-5.533-4.182a16.207 16.207 0 01-.754-1.144l-.049-.08a13.472 13.472 0 01-.565-1.001 16.503 16.503 0 01-1.11-3.135l30.494-16.22 2.194.806z"
          fill="#B19CD8"
          fillOpacity={0.5}
        />
        <Path
          d="M98.337 109.871c-.85.707-1.866.913-2.579.705-1.122-.328-2.135-1.87-1.342-3.935.794-2.066 2.668-2.764 3.79-2.437.65.19 1.262.786 1.51 1.654l.1-.26 2.206-1.151c-.525-1.252-1.532-2.223-2.901-2.623-2.769-.809-5.971 1.028-7.152 4.102-1.181 3.074.106 6.221 2.875 7.03 1.482.433 3.09.108 4.444-.76l-.951-2.325z"
          fill="#F9F0FC"
        />
      </G>
      <G>
        <Path
          transform="rotate(-6.742 215.724 28.931)"
          fill="#B19CD8"
          d="M215.724 28.9312H277.95349999999996V91.1607H215.724z"
        />
        <Path
          transform="rotate(-6.742 228.681 39.149)"
          fill="url(#paint0_linear_37_486)"
          d="M228.681 39.1486H267.5744V78.042H228.681z"
        />
        <Path
          opacity={0.35}
          d="M233.247 77.773l38.625-4.566 12.957 10.217-61.799 7.306 10.217-12.957z"
          fill="url(#paint1_linear_37_486)"
        />
        <Path
          opacity={0.25}
          d="M228.681 39.149L215.724 28.93l7.306 61.8 10.217-12.958-4.566-38.624z"
          fill="url(#paint2_linear_37_486)"
        />
        <Path
          opacity={0.25}
          d="M267.305 34.582l10.218-12.957 7.306 61.8-12.957-10.218-4.567-38.625z"
          fill="url(#paint3_linear_37_486)"
        />
        <Path
          opacity={0.15}
          d="M228.681 39.149l38.624-4.567 10.218-12.957-61.799 7.306 12.957 10.218z"
          fill="url(#paint4_linear_37_486)"
        />
      </G>
      <G>
        <Path
          transform="rotate(11.015 460.39 33.27)"
          fill="#B19CD8"
          d="M460.39 33.2701H486.6644V59.5445H460.39z"
        />
        <Path
          opacity={0.05}
          transform="rotate(11.015 460.39 33.27)"
          fill="#15101A"
          d="M460.39 33.2701H486.6644V59.5445H460.39z"
        />
        <G opacity={0.4}>
          <Mask id="a" fill="#fff">
            <Path d="M460.809 31.12l25.79 5.021-1.255 6.448-25.79-5.02 1.255-6.448z" />
          </Mask>
          <Path
            d="M486.299 37.68l-25.79-5.02-1.911 9.816 25.791 5.02 1.91-9.815z"
            fill="#BEA9DF"
            mask="url(#a)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="b" fill="#fff">
            <Path d="M459.554 37.569l25.79 5.02-1.255 6.447-25.79-5.02 1.255-6.447z" />
          </Mask>
          <Path
            d="M485.044 44.129l-25.79-5.02-1.911 9.815 25.791 5.02 1.91-9.816z"
            fill="#BEA9DF"
            mask="url(#b)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="c" fill="#fff">
            <Path d="M458.299 44.016l25.79 5.02-1.255 6.448-25.79-5.02 1.255-6.448z" />
          </Mask>
          <Path
            d="M483.789 50.576l-25.79-5.02-1.911 9.816 25.791 5.02 1.91-9.816z"
            fill="#BEA9DF"
            mask="url(#c)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="d" fill="#fff">
            <Path d="M457.044 50.464l25.79 5.02-1.255 6.448-25.79-5.02 1.255-6.448z" />
          </Mask>
          <Path
            d="M482.534 57.024l-25.79-5.02-1.911 9.815 25.791 5.02 1.91-9.815z"
            fill="#BEA9DF"
            mask="url(#d)"
          />
        </G>
        <Path
          transform="rotate(-33.985 452.316 58.544)"
          fill="#BEA9DF"
          d="M452.316 58.5442H493.9172V62.923269999999995H452.316z"
        />
        <Path
          transform="rotate(56.015 460.976 30.261)"
          fill="#BEA9DF"
          d="M460.976 30.2613H502.5772V34.64037H460.976z"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M484.622 69.216l6.694-34.387-30.089-5.857-4.298-.837-6.694 34.387 34.387 6.694zm-3.461-5.135l-25.791-5.02 5.02-25.79 25.791 5.02-5.02 25.79z"
          fill="#CCB7E5"
        />
        <Path
          opacity={0.1}
          d="M451.825 54.355l36.688-5.127-3.891 19.988-34.387-6.694 1.59-8.167z"
          fill="#15101A"
        />
      </G>
      <G>
        <Path
          transform="rotate(-16.727 397.418 56.041)"
          fill="#B19CD8"
          d="M397.418 56.0413H433.4304V92.05369999999999H397.418z"
        />
        <Path
          opacity={0.05}
          transform="rotate(-16.727 397.418 56.041)"
          fill="#15101A"
          d="M397.418 56.0413H433.4304V92.05369999999999H397.418z"
        />
        <G opacity={0.4}>
          <Mask id="e" fill="#fff">
            <Path d="M396.554 53.167l34.489-10.364 2.591 8.622-34.488 10.364-2.592-8.622z" />
          </Mask>
          <Path
            d="M432.195 46.636l-34.488 10.365 2.878 9.577 34.488-10.365-2.878-9.577z"
            fill="#BEA9DF"
            mask="url(#e)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="f" fill="#fff">
            <Path d="M399.146 61.79l34.488-10.365 2.591 8.622-34.488 10.365-2.591-8.623z" />
          </Mask>
          <Path
            d="M434.786 55.259l-34.488 10.364 2.878 9.577 34.488-10.364-2.878-9.577z"
            fill="#BEA9DF"
            mask="url(#f)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="g" fill="#fff">
            <Path d="M401.737 70.412l34.488-10.365 2.591 8.622-34.488 10.365-2.591-8.622z" />
          </Mask>
          <Path
            d="M437.377 63.88l-34.488 10.365 2.878 9.577 34.488-10.364-2.878-9.577z"
            fill="#BEA9DF"
            mask="url(#g)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="h" fill="#fff">
            <Path d="M404.328 79.034l34.488-10.365 2.592 8.623-34.489 10.364-2.591-8.622z" />
          </Mask>
          <Path
            d="M439.969 72.503L405.48 82.868l2.878 9.576 34.489-10.364-2.878-9.577z"
            fill="#BEA9DF"
            mask="url(#h)"
          />
        </G>
        <Path
          transform="rotate(-61.727 403.748 91.852)"
          fill="#BEA9DF"
          d="M403.748 91.8522H460.7676V97.85427H403.748z"
        />
        <Path
          transform="rotate(28.273 396.209 52.018)"
          fill="#BEA9DF"
          d="M396.209 52.0177H453.22860000000003V58.019769999999994H396.209z"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M449.747 84.186l-13.819-45.985-40.237 12.092-5.748 1.728 13.819 45.985 45.985-13.82zm-7.476-4.02L407.783 90.53l-10.365-34.489 34.489-10.364 10.364 34.489z"
          fill="#CCB7E5"
        />
        <Path
          opacity={0.1}
          d="M400.48 87.084l41.234-29.627 8.033 26.73-45.985 13.819-3.282-10.922z"
          fill="#15101A"
        />
      </G>
      <G>
        <Path
          transform="rotate(14.006 150.909 38.081)"
          fill="#B19CD8"
          d="M150.909 38.081H204.214V91.386H150.909z"
        />
        <Path
          opacity={0.05}
          transform="rotate(14.006 150.909 38.081)"
          fill="#15101A"
          d="M150.909 38.081H204.214V91.386H150.909z"
        />
        <G opacity={0.4}>
          <Mask id="i" fill="#fff">
            <Path d="M151.984 33.771l51.72 12.901-3.225 12.93-51.72-12.901 3.225-12.93z" />
          </Mask>
          <Path
            d="M201.689 54.751l-51.72-12.901-2.421 9.702 51.721 12.902 2.42-9.703z"
            fill="#BEA9DF"
            mask="url(#i)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="j" fill="#fff">
            <Path d="M148.759 46.701l51.72 12.901-3.226 12.93-51.72-12.9 3.226-12.931z" />
          </Mask>
          <Path
            d="M198.464 67.681L146.743 54.78l-2.42 9.702 51.72 12.902 2.421-9.703z"
            fill="#BEA9DF"
            mask="url(#j)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="k" fill="#fff">
            <Path d="M145.533 59.631l51.72 12.901-3.225 12.93-51.72-12.9 3.225-12.93z" />
          </Mask>
          <Path
            d="M195.238 80.611l-51.72-12.901-2.42 9.703 51.72 12.9 2.42-9.702z"
            fill="#BEA9DF"
            mask="url(#k)"
          />
        </G>
        <G opacity={0.4}>
          <Mask id="l" fill="#fff">
            <Path d="M142.308 72.561l51.72 12.901-3.225 12.93-51.72-12.9 3.225-12.93z" />
          </Mask>
          <Path
            d="M192.013 93.541l-51.72-12.901-2.42 9.703 51.72 12.901 2.42-9.703z"
            fill="#BEA9DF"
            mask="url(#l)"
          />
        </G>
        <Path
          transform="rotate(-30.994 131.875 88.432)"
          fill="#BEA9DF"
          d="M131.875 88.4317H216.2745V97.31586H131.875z"
        />
        <Path
          transform="rotate(59.006 152.414 32.047)"
          fill="#BEA9DF"
          d="M152.414 32.047H236.81349999999998V40.93116H152.414z"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M196.198 113.473l17.201-68.96-60.34-15.052-8.62-2.15-17.202 68.96 68.961 17.202zm-6.47-10.771l-51.72-12.9 12.901-51.721 51.72 12.901-12.901 51.72z"
          fill="#CCB7E5"
        />
        <Path
          opacity={0.1}
          d="M131.323 79.893l74.873-6.503-9.998 40.083-68.961-17.202 4.086-16.378z"
          fill="#15101A"
        />
      </G>
      <G>
        <Path
          d="M613.625 71.515c-7.516-6.695-12.363-8.144-22.003-7.114-9.806.971-14.554-.8-22.004-7.115l8.615-26.642c7.731 6.716 12.684 7.656 22.003 7.115 9.597-.327 14.43 1.182 22.004 7.114l-10.185 10.37 1.57 16.272z"
          fill="#BEA9DF"
          fillOpacity={0.5}
        />
        <Path
          transform="rotate(107.918 580.624 24.06)"
          fill="#CCB7E5"
          d="M580.624 24.0605H660.624V34.060500000000005H580.624z"
        />
        <Circle
          cx={575.559}
          cy={23.4737}
          r={8}
          transform="rotate(17.918 575.559 23.474)"
          fill="#CCB7E5"
        />
        <Path
          opacity={0.1}
          d="M553.419 75.695l11.669-3.584-9.076 28.069-9.515-3.076 6.922-21.409zM583.314 21.777a8 8 0 01-15.646 3.35l7.823-1.675 7.823-1.675z"
          fill="#15101A"
        />
      </G>
      <G>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M665.798 84.403c1.695.646 3.189 1.64 3.339 2.237.035.151.021.398-.037.549-.153.4-7.548 7.744-7.97 7.916-.19.077-1.124.295-2.08.482l-.025.005c-1.056.206-1.56.305-2.007.188-.409-.108-.77-.396-1.461-.947l-.009-.007c-.529-.42-1.011-.753-1.052-.734-.046.029-.451.758-.89 1.636-.449.874-.906 1.676-1.019 1.793-.252.237-3.659.971-4.155.885-.249-.037-.681-.351-1.704-1.223-.744-.64-1.394-1.163-1.439-1.135-.042.019-.491.743-1.004 1.604-.513.86-1.024 1.654-1.124 1.765-.355.358-.769.27-2.707-.584l-1.767-.788-1.245.249c-.682.13-1.324.276-1.417.31l-12.517 2.443 1.151-10.248 8.877-1.826c.01.023 1.701-.319 3.752-.763 9.849-2.102 19.034-3.882 22.765-4.412 2.042-.29 3.93-.087 5.745.605z"
          fill="#B19CD8"
        />
        <G fill="#CCB7E5">
          <Path d="M633.357 99.875c.023.105.052.225.086.365l-.086-.365z" />
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M626.17 88.37a4.462 4.462 0 01-.435-.453c-1.289-1.41-2.669-2.338-4.779-3.222-1.842-.771-3.124-1.088-4.751-1.191-4.451-.261-8.938 1.645-11.813 5.016-1.242 1.54-1.805 2.45-2.486 4.185-.86 2.28-1.139 4.24-.912 6.531.254 2.612 1.169 5.119 2.568 7.019 1.021 1.279 1.62 1.944 2.796 2.937 1.234 1.01 2.42 1.635 4.399 2.32 1.945.684 3.025.866 4.893.82 5.542-.126 10.576-3.432 12.755-8.378l.527-1.199.462.076c.256.049 1.103.27 1.89.483.792.228 1.581.389 1.762.378.437-.046.744-.359.84-.875.016-.085.028-.152.034-.223.024-.279-.055-.605-.444-2.216l-.033-.138c-.034-.14-.063-.26-.086-.365-1.368-3.809-1.927-6.05-2.438-10.297-.01-.028-.106-.604-.206-1.29-.209-1.355-.403-1.866-.792-2.12-.579-.367-1.263-.042-2.902 1.403l-.849.8zm-15.167 13.395c.4-.054 1.241-.572 1.572-.985 1.294-1.551.675-3.9-1.231-4.626-1.166-.445-2.494-.05-3.402.694-.424.356-.654 1.71-.579 2.324.078.638.461 1.439.876 1.827.176.17.334.299.351.283.347.327 1.372.726 2.413.483z"
          />
        </G>
        <Path
          d="M635.33 90.526l25.993-5.142c1.462.026 2.27.067 3.361.924l-9.254 3.42-19.878 3.932-.222-3.134z"
          fill="#CCB7E5"
        />
        <Path
          opacity={0.05}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M624.641 108.944a13.777 13.777 0 003.764-4.99l.527-1.199.462.076c.256.049 1.103.27 1.89.483.792.228 1.581.389 1.762.378.437-.046.744-.359.84-.875.016-.085.028-.152.034-.223.024-.279-.055-.605-.444-2.216l-.033-.138-.086-.365c-1.368-3.809-1.927-6.05-2.438-10.297-.01-.028-.106-.604-.206-1.29-.209-1.355-.402-1.866-.792-2.12-.579-.367-1.263-.042-2.902 1.403l-.849.8a4.462 4.462 0 01-.435-.454c-1.289-1.41-2.669-2.338-4.779-3.222-1.842-.771-3.124-1.088-4.751-1.191a14.098 14.098 0 00-2.628.093l11.064 25.347z"
          fill="#15101A"
        />
      </G>
      <Path opacity={0.75} fill="#fff" d="M0 0H681V141H0z" />
      <G fill="#CCB7E5">
        <Path d="M68.626 91.383c-4.413.467-8.504-.088-12.275-1.663-3.728-1.58-6.792-3.98-9.191-7.202-2.362-3.269-3.77-7.046-4.222-11.331-.453-4.286.136-8.252 1.767-11.9 1.67-3.694 4.183-6.706 7.54-9.034 3.358-2.328 7.244-3.726 11.657-4.192 3.31-.35 6.422-.12 9.34.686 2.916.808 5.463 2.169 7.639 4.084l-2.675 3.308c-3.852-3.154-8.43-4.451-13.733-3.89-3.522.371-6.64 1.516-9.355 3.433-2.715 1.917-4.752 4.364-6.111 7.339-1.316 2.97-1.79 6.196-1.423 9.675.367 3.48 1.505 6.534 3.414 9.164 1.95 2.626 4.453 4.592 7.509 5.9 3.056 1.307 6.344 1.775 9.866 1.403 5.346-.565 9.55-2.811 12.61-6.739L84.29 83.1c-1.727 2.327-3.952 4.214-6.674 5.66-2.684 1.4-5.68 2.274-8.99 2.623zM100.822 60.664c.86-2.347 2.28-4.188 4.26-5.522 2.021-1.338 4.584-2.146 7.686-2.425l.394 4.399-1.089.033c-3.527.317-6.192 1.648-7.995 3.995-1.803 2.346-2.529 5.474-2.179 9.384l1.533 17.083-4.526.406-3.008-33.53 4.335-.388.589 6.565zM138.879 50.63c4.382-.33 7.827.523 10.333 2.56 2.504 1.993 3.917 5.138 4.241 9.435l1.568 20.805-4.34.327-.394-5.233c-.89 1.821-2.298 3.297-4.224 4.426-1.883 1.126-4.186 1.791-6.909 1.996-3.744.283-6.79-.386-9.137-2.007-2.347-1.62-3.631-3.898-3.852-6.834-.215-2.85.633-5.225 2.544-7.123 1.953-1.901 5.185-3.022 9.695-3.362l10.657-.803-.153-2.042c-.218-2.893-1.192-5.023-2.921-6.39-1.732-1.41-4.151-1.998-7.257-1.764-2.127.16-4.142.675-6.045 1.546-1.906.828-3.514 1.912-4.825 3.252l-2.297-3.229c1.593-1.575 3.552-2.835 5.877-3.78 2.321-.988 4.801-1.581 7.439-1.78zm.707 30.69c2.553-.192 4.701-.932 6.444-2.218 1.74-1.33 2.973-3.134 3.7-5.414l-.414-5.488-10.53.793c-5.744.433-8.465 2.649-8.164 6.648.148 1.957 1.009 3.454 2.585 4.49 1.573.995 3.699 1.39 6.379 1.189zM190.04 79.16c-.805.82-1.833 1.48-3.085 1.984a13.1 13.1 0 01-3.862.813c-3.151.192-5.631-.511-7.438-2.111-1.807-1.6-2.806-3.954-2.996-7.063L171.42 52.47l-6.005.366-.233-3.833 6.004-.366-.448-7.346 4.536-.277.448 7.346 10.221-.623.234 3.833-10.221.623 1.223 20.059c.122 2.002.706 3.505 1.75 4.51 1.085.96 2.564 1.382 4.438 1.268a8.072 8.072 0 002.655-.61c.877-.353 1.617-.826 2.222-1.419l1.796 3.16zM231.874 63.714l-28.129 1.308c.418 3.483 1.892 6.255 4.423 8.316 2.528 2.018 5.646 2.94 9.354 2.768 2.089-.097 3.99-.548 5.703-1.354a12.923 12.923 0 004.385-3.535l2.694 2.821c-1.409 1.86-3.22 3.31-5.436 4.354-2.172 1.04-4.601 1.623-7.286 1.748-3.453.16-6.555-.421-9.307-1.746-2.712-1.369-4.875-3.318-6.487-5.849-1.613-2.53-2.495-5.436-2.648-8.718-.153-3.282.414-6.255 1.7-8.92 1.328-2.668 3.194-4.783 5.599-6.348 2.447-1.566 5.226-2.421 8.338-2.566 3.111-.144 5.936.45 8.476 1.785 2.539 1.334 4.572 3.268 6.1 5.803 1.525 2.491 2.365 5.4 2.52 8.724l.001 1.41zm-16.916-13.82c-3.239.15-5.918 1.32-8.038 3.512-2.078 2.147-3.189 4.89-3.333 8.228l23.846-1.109c-.453-3.31-1.835-5.937-4.146-7.88-2.271-1.987-5.047-2.904-8.329-2.752zM256.184 78.65a26.83 26.83 0 01-7.904-.908c-2.498-.734-4.47-1.676-5.914-2.827l1.937-3.645c1.441 1.065 3.239 1.927 5.394 2.586 2.153.617 4.382.89 6.684.819 3.071-.095 5.317-.634 6.738-1.617 1.462-1.027 2.166-2.415 2.112-4.163-.038-1.237-.473-2.184-1.304-2.841-.832-.7-1.872-1.202-3.12-1.505-1.248-.345-2.901-.657-4.959-.935-2.745-.428-4.957-.872-6.636-1.332a10.183 10.183 0 01-4.371-2.619c-1.191-1.243-1.821-2.995-1.891-5.256-.087-2.814 1.015-5.153 3.305-7.017 2.29-1.864 5.525-2.86 9.705-2.989a24.557 24.557 0 016.552.694c2.192.488 4.006 1.179 5.443 2.074l-1.871 3.707c-2.831-1.834-6.166-2.691-10.004-2.573-2.9.09-5.081.67-6.542 1.739-1.418 1.068-2.101 2.434-2.05 4.097.039 1.28.476 2.29 1.31 3.033.877.742 1.939 1.285 3.188 1.63 1.247.304 2.964.614 5.151.93 2.702.43 4.872.874 6.508 1.336a9.49 9.49 0 014.239 2.495c1.19 1.2 1.818 2.889 1.885 5.064.091 2.942-1.073 5.326-3.493 7.151-2.378 1.78-5.742 2.738-10.092 2.873zM338.981 77.724l-6.246-6.363c-3.773 4.076-8.753 6.133-14.939 6.17-2.902.017-5.507-.437-7.817-1.362-2.267-.967-4.045-2.3-5.336-4-1.29-1.741-1.942-3.721-1.955-5.94-.016-2.688.823-5.104 2.517-7.247 1.693-2.144 4.581-4.401 8.663-6.772-2.146-2.206-3.63-4.075-4.449-5.606a10.778 10.778 0 01-1.246-4.984c-.017-2.859.993-5.17 3.03-6.93 2.038-1.762 4.785-2.653 8.241-2.674 3.2-.019 5.743.755 7.63 2.323 1.886 1.567 2.838 3.737 2.855 6.51.013 2.22-.722 4.229-2.204 6.03-1.483 1.758-4.053 3.715-7.709 5.87l12.363 12.598c1.351-2.44 2.336-5.326 2.956-8.657l3.719 1.13c-.787 4.015-2.089 7.457-3.906 10.327l6.439 6.553-2.606 3.024zm-19.517-42.316c-2.219.013-3.965.578-5.238 1.695-1.231 1.117-1.841 2.593-1.83 4.427.008 1.323.357 2.58 1.047 3.77s2.043 2.804 4.061 4.84c3.231-1.897 5.462-3.51 6.691-4.84s1.839-2.784 1.83-4.363c-.01-1.707-.594-3.047-1.752-4.022-1.158-1.017-2.761-1.52-4.809-1.507zm-1.435 38.345c4.949-.03 8.95-1.739 12.002-5.127l-13.587-13.808c-3.529 2.027-5.972 3.855-7.328 5.484-1.312 1.63-1.963 3.447-1.951 5.452.015 2.432 1.008 4.389 2.979 5.87 2.014 1.439 4.642 2.149 7.885 2.13zM396.152 78.149c-4.437-.096-8.425-1.164-11.966-3.204-3.498-2.038-6.234-4.807-8.207-8.307-1.929-3.54-2.847-7.466-2.754-11.774.093-4.308 1.179-8.168 3.259-11.58 2.123-3.454 4.997-6.123 8.623-8.008 3.625-1.885 7.656-2.78 12.093-2.683 3.327.071 6.386.692 9.177 1.862 2.792 1.17 5.146 2.843 7.062 5.018l-3.072 2.942c-3.422-3.616-7.799-5.481-13.131-5.597-3.54-.076-6.778.665-9.714 2.223-2.936 1.558-5.266 3.727-6.99 6.507-1.682 2.78-2.561 5.92-2.636 9.417-.076 3.498.667 6.672 2.227 9.522 1.603 2.852 3.837 5.119 6.703 6.803 2.865 1.683 6.068 2.563 9.609 2.64 5.375.116 9.828-1.58 13.361-5.089l2.942 3.072c-2.008 2.09-4.454 3.68-7.337 4.77-2.839 1.05-5.922 1.537-9.249 1.466zM431.976 51.75c1.15-2.22 2.791-3.866 4.924-4.94 2.175-1.07 4.818-1.548 7.931-1.432l-.165 4.413-1.085-.104c-3.539-.133-6.351.85-8.436 2.95-2.086 2.1-3.202 5.11-3.349 9.033l-.641 17.14-4.541-.17L427.873 45l4.349.163-.246 6.587zM470.996 46.611c4.389.227 7.698 1.51 9.927 3.846 2.231 2.295 3.235 5.593 3.013 9.897l-1.078 20.836-4.346-.224.271-5.241c-1.113 1.694-2.696 2.979-4.75 3.855-2.01.879-4.379 1.248-7.106 1.107-3.75-.194-6.686-1.243-8.809-3.147-2.124-1.905-3.109-4.327-2.957-7.267.148-2.855 1.289-5.103 3.425-6.744 2.178-1.639 5.526-2.342 10.042-2.108l10.674.552.106-2.045c.15-2.898-.547-5.134-2.089-6.71-1.539-1.617-3.865-2.506-6.975-2.667a17.579 17.579 0 00-6.192.77c-1.995.58-3.728 1.451-5.198 2.614l-1.87-3.493c1.779-1.36 3.882-2.363 6.307-3.006 2.428-.686 4.963-.961 7.605-.825zm-3.181 30.533c2.557.132 4.781-.33 6.672-1.385 1.894-1.099 3.346-2.733 4.355-4.902l.285-5.497-10.546-.545c-5.753-.297-8.732 1.556-8.939 5.562-.102 1.96.563 3.554 1.995 4.781 1.434 1.185 3.494 1.847 6.178 1.986zM518.136 81.386c-.902.71-2.005 1.236-3.311 1.577-1.26.302-2.571.408-3.933.318-3.151-.208-5.521-1.22-7.112-3.035-1.59-1.816-2.283-4.278-2.078-7.385l1.341-20.308-6.003-.397.253-3.831 6.003.396.485-7.344 4.534.3-.484 7.343 10.217.675-.253 3.832-10.217-.675-1.325 20.053c-.132 2 .257 3.565 1.166 4.694.954 1.09 2.368 1.696 4.241 1.82a8.082 8.082 0 002.712-.27c.913-.239 1.708-.614 2.383-1.126l1.381 3.363zM561.589 71.356l-28.069-2.261c-.026 3.508 1.086 6.444 3.335 8.808 2.253 2.322 5.229 3.632 8.929 3.93 2.084.168 4.027-.04 5.829-.622a12.934 12.934 0 004.797-2.952l2.315 3.14c-1.633 1.666-3.613 2.876-5.943 3.63-2.287.758-4.77 1.029-7.449.813-3.445-.278-6.449-1.248-9.012-2.91-2.517-1.7-4.415-3.908-5.694-6.622-1.28-2.714-1.788-5.709-1.524-8.983.264-3.275 1.202-6.153 2.815-8.634 1.655-2.478 3.774-4.34 6.357-5.588 2.626-1.244 5.491-1.74 8.596-1.49 3.104.25 5.832 1.197 8.182 2.842 2.35 1.645 4.122 3.82 5.317 6.528 1.197 2.665 1.663 5.656 1.396 8.973l-.177 1.398zm-15.032-15.85c-3.232-.26-6.038.562-8.417 2.468-2.334 1.867-3.783 4.447-4.348 7.74l23.795 1.917c-.031-3.341-1.069-6.121-3.116-8.341-2.001-2.259-4.639-3.52-7.914-3.784zM581.766 61.537c1.276-2.15 3.009-3.7 5.199-4.648 2.233-.945 4.9-1.27 8.001-.975l-.419 4.396-1.077-.166c-3.525-.336-6.389.485-8.591 2.46-2.203 1.977-3.49 4.919-3.862 8.827l-1.624 17.075-4.524-.43 3.189-33.513 4.332.412-.624 6.562zM614.561 92.388a26.826 26.826 0 01-7.702-1.994c-2.373-1.072-4.195-2.278-5.466-3.618l2.422-3.342c1.281 1.254 2.942 2.357 4.985 3.308a21.7 21.7 0 006.507 1.735c3.054.331 5.353.109 6.896-.668 1.59-.815 2.48-2.092 2.668-3.831.134-1.23-.166-2.228-.898-2.994-.728-.809-1.689-1.45-2.882-1.922-1.189-.515-2.783-1.053-4.782-1.613-2.66-.803-4.789-1.549-6.388-2.237a10.178 10.178 0 01-3.967-3.198c-1.007-1.397-1.389-3.22-1.145-5.468.303-2.8 1.718-4.963 4.244-6.492s5.868-2.068 10.025-1.617c2.163.234 4.294.766 6.393 1.594 2.104.786 3.805 1.721 5.104 2.806l-2.366 3.413c-2.55-2.207-5.734-3.518-9.552-3.932-2.884-.313-5.124-.04-6.719.817-1.553.862-2.418 2.12-2.598 3.774-.138 1.272.155 2.334.878 3.185.766.856 1.743 1.54 2.932 2.056 1.193.473 2.851 1.017 4.973 1.633 2.617.799 4.704 1.54 6.26 2.224a9.496 9.496 0 013.853 3.057c1.012 1.354 1.401 3.113 1.167 5.276-.318 2.927-1.801 5.127-4.449 6.6-2.602 1.434-6.066 1.917-10.393 1.448z" />
      </G>
      <Defs>
        <LinearGradient
          id="paint0_linear_37_486"
          x1={228.681}
          y1={78.042}
          x2={267.574}
          y2={39.1486}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0.35} />
          <Stop offset={1} stopOpacity={0.2} />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_37_486"
          x1={253.929}
          y1={87.0772}
          x2={252.559}
          y2={75.4898}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0} />
          <Stop offset={0.333333} stopOpacity={0.5} />
          <Stop offset={1} />
        </LinearGradient>
        <LinearGradient
          id="paint2_linear_37_486"
          x1={215.724}
          y1={28.9312}
          x2={227.311}
          y2={27.5613}
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopOpacity={0} />
          <Stop offset={0.333333} stopOpacity={0.5} />
          <Stop offset={1} />
        </LinearGradient>
        <LinearGradient
          id="paint3_linear_37_486"
          x1={265.935}
          y1={22.9949}
          x2={277.523}
          y2={21.625}
          gradientUnits="userSpaceOnUse"
        >
          <Stop />
          <Stop offset={0.666667} stopOpacity={0.5} />
          <Stop offset={1} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="paint4_linear_37_486"
          x1={246.623}
          y1={25.2781}
          x2={247.993}
          y2={36.8654}
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