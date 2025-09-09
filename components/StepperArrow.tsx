import { Path, Svg } from "react-native-svg";
import { normalize } from "../TextStyles";
import ResponsivePressable from "./ResponsivePressable";

interface Props {
    color: string,
    onPress: () => void,
    flipped?: boolean, // If flipped, points left instead of right.
}

export default function StepperArrow({ color, onPress, flipped }: Props) {
    const size = normalize(20);
    const offset = -(size + normalize(12));

    return (
        <ResponsivePressable
            onPress={onPress}
            hitSlop={normalize(10)}
            pressedSize={0.9}
            customStyle={{
                position: "absolute",
                ...(flipped ? { left: offset } : { right: offset }),
            }}
        >
            <Svg
                width={size}
                height={size}
                viewBox="-5 0 50 55"
                fill="none"
                // @ts-expect-error
                xmlns="http://www.w3.org/2000/svg"
            >
                {flipped ?
                    <Path // left
                        d="M39.652 7.65c2.212-4.677-3.268-9.223-7.456-6.184L2.578 22.953c-2.751 1.996-2.751 6.098 0 8.094l29.618 21.487c4.188 3.039 9.668-1.507 7.456-6.185L30.5 27l9.152-19.35z"
                        fill={color}
                    />
                    :
                    <Path // right
                        d="M1.348 7.65C-.864 2.974 4.616-1.572 8.804 1.467l29.618 21.487c2.751 1.996 2.751 6.098 0 8.094L8.804 52.534c-4.188 3.039-9.668-1.507-7.456-6.185L10.5 27 1.348 7.65z"
                        fill={color}
                    />
                }
            </Svg>
        </ResponsivePressable>
    );
}