import { Pressable, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { colors } from '../Theme';
const win = Dimensions.get('window');

export default function IconButton({ onPress }) {
  const [pressed, setPressedState] = useState(false);

  return (
    <Pressable onPress={onPress} hitSlop={30} style={{
      transform: [{
        scale: pressed ? 0.9 : 1,
      }],
    }} onPressIn={() => { setPressedState(!!onPress) }} onPressOut={() => { setPressedState(false) }}>
      <Svg
        width={win.width * 0.05}
        height={win.width * 0.05}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M40.73 11.937C41.566 8.733 43.808.368 43.86.19c.071-.178 1.388-.213 6.175-.178l6.103.054 1.601 5.962c.89 3.275 1.655 6.087 1.726 6.247.054.16.498.392.979.498 2.224.552 6.299 2.243 8.38 3.453l1.033.605 5.587-3.257 5.605-3.257 4.324 4.307 4.324 4.325-6.442 11.142 1.353 2.705c.765 1.566 1.637 3.648 2.064 5.001.391 1.281.782 2.42.854 2.563.07.16 2.544.89 6.245 1.886l6.139 1.638.053 6.122.036 6.123-4.929 1.317c-2.722.73-5.516 1.477-6.21 1.655l-1.28.356-.837 2.58a46.197 46.197 0 01-2.171 5.25l-1.335 2.653 6.442 11.105-8.648 8.65-11.103-6.443-2.67 1.335a42.403 42.403 0 01-5.32 2.19l-2.65.854-1.442 5.606a560.562 560.562 0 00-1.548 6.194l-.125.569-6.138-.036-6.14-.053-.497-1.869-.354-1.356c-.343-1.319-.826-3.169-1.248-4.82l-1.103-4.307-.997-.284c-2.473-.695-4.572-1.513-7.064-2.759l-2.686-1.353-10.979 6.532-8.648-8.65 6.566-11.088-.783-1.388c-1.05-1.833-2.455-5.197-3.114-7.421l-.176-.575c-.219-.71-.383-1.244-.41-1.259-.019-.017-2.812-.747-6.229-1.62L0 56.13l.036-6.123.053-6.122 1.868-.48c.142-.038.311-.081.503-.13 1.2-.312 3.28-.85 5.013-1.295 2.011-.498 3.95-.996 4.306-1.103.171-.05.298-.089.405-.157.303-.196.443-.645.983-2.37.819-2.545 2.046-5.446 3.079-7.19l.658-1.122-3.292-5.553-3.31-5.535 8.648-8.65 5.552 3.293 5.551 3.275 1.442-.783c2.42-1.353 7.811-3.47 8.808-3.47.142 0 .32-.286.427-.677zM50 70c11.046 0 20-8.954 20-20s-8.954-20-20-20-20 8.954-20 20 8.954 20 20 20z"
          fill={colors.DARK_PURPLE}
        />
      </Svg>
    </Pressable>
  );
}