import { useState } from "react";
import { Pressable, ViewStyle } from "react-native";

interface Props {
    onPress?: () => void,
    onLongPress?: () => void,
    customStyle?: ViewStyle | ViewStyle[],
    pressedStyle?: ViewStyle,
    hitSlop?: number,
    pressedSize?: number, // Defaults to 0.98
    disabled?: boolean,
    children?: React.ReactNode,
}

export default function ResponsivePressable({
    onPress,
    onLongPress,
    customStyle,
    pressedStyle,
    hitSlop,
    pressedSize,
    disabled,
    children,
}: Props) {
    const [pressed, setPressedState] = useState(false);
    const _pressedSize = pressedSize || 0.98;

    return (
        <Pressable
            style={[
                customStyle,
                {
                    transform: [{ scale: pressed ? _pressedSize : 1 }],
                    opacity: (disabled) ? 0.5 : 1,
                },
                pressed && pressedStyle,
            ]}
            onPress={() => {
                // We do this as opposed to using the disable property so we still capture the click event if disabled.
                if (!disabled && onPress) onPress();
            }}
            onLongPress={() => {
                const doLongPress = !disabled && !!onLongPress;
                setPressedState(doLongPress); // To give visual feedback even for buttons with only onLongPress but no onPress.
                if (doLongPress) onLongPress();
            }}
            onPressIn={() => setPressedState(!disabled && !!onPress)}
            onPressOut={() => setPressedState(false)}
            hitSlop={hitSlop}

        // TODO: Decide if the touch sound is desired or not.
        // // @ts-expect-error
        // touchSoundDisabled={false}
        // android_disableSound={false}
        >{children}</Pressable>
    );
}