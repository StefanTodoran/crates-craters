import React from "react";
import { Dimensions, Image, ImageSourcePropType } from "react-native";

const win = Dimensions.get("window");
const width = 687;
const height = 150;

interface Props {
  bannerImage: ImageSourcePropType,
  widthPercent: number,
}

// Returns a list [width, height] of the size for an element based
// on the image's size and the desired width percent to be occupied.
function sizeFromWidthPercent(widthPercent: number) {
  const percent = widthPercent / 100;
  const ratio = win.width * percent / width;
  return [
    Math.round(win.width * percent),
    Math.round(ratio * height),
  ];
}

export default function Banner({ bannerImage, widthPercent }: Props) {
  return (
    <Image
      style={{
        width: sizeFromWidthPercent(widthPercent)[0],
        height: sizeFromWidthPercent(widthPercent)[1],
      }}
      source={bannerImage}
    />
  );
}