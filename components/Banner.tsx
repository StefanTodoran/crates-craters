import { Image, ImageSourcePropType } from "react-native";
import { sizeFromWidthPercent } from "../TextStyles";

const width = 687;
const height = 150;

interface Props {
  bannerImage: ImageSourcePropType,
  widthPercent: number,
}

export default function Banner({ bannerImage, widthPercent }: Props) {
  return (
    <Image
      style={{
        width: sizeFromWidthPercent(widthPercent, width, height).width,
        height: sizeFromWidthPercent(widthPercent, width, height).height,
      }}
      source={bannerImage}
    />
  );
}