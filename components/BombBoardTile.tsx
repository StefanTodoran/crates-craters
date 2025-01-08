import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { TileIcon } from "../assets/Icons";
import { BombTile, FlatTile } from "../util/types";

interface Props {
  tile: FlatTile,
  icon: any,
  tileSize: number,
  bgColor?: string,
}

export default function BombBoardTile({
  tile, icon, tileSize, bgColor
}: Props) {
  const useSvg = Platform.OS === "ios";

  const tileGraphic = useSvg ?
    <TileIcon bgColor={bgColor} tileSize={tileSize} tileData={tile} /> :
    <Image style={styles.tile(bgColor, tileSize)} source={icon} />;

  return <>
    {tileGraphic}
    <View style={styles.entityContainer(tileSize)}>
      <Text style={[styles.entity, { fontSize: tileSize * 0.3 }]} allowFontScaling={false}>
        {(tile as BombTile).fuse}
      </Text>
    </View>
  </>;
}

const styles = StyleSheet.create<any>({
  tile: (bgColor: string, size: number) => ({
    width: size,
    height: size,
    backgroundColor: bgColor,
  }),
  entityContainer: (size: number) => ({
    position: "absolute",
    width: size,
    height: size,
    paddingTop: "17.5%",
    paddingRight: "5%",
    justifyContent: "center",
    alignItems: "center",
  }),
  entity: {
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
  },
});