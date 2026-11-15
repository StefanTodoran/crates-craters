import { StyleSheet, Text, View } from "react-native";
import { TileIcon } from "../assets/Icons";
import { BombTile, FlatTile } from "../util/types";
import FuseSpark from "./FuseSpark";

interface Props {
  tile: FlatTile,
  tileSize: number,
  bgColor?: string,
}

export default function BombBoardTile({
  tile, tileSize, bgColor
}: Props) {
  // Always the SVG: the fuse is drawn to the remaining countdown.
  const tileGraphic = <TileIcon bgColor={bgColor} tileSize={tileSize} tileData={tile} />;

  return <>
    {tileGraphic}
    <View style={[styles.entityContainer, { width: tileSize, height: tileSize }]}>
      <Text style={[styles.entity, { fontSize: tileSize * 0.3 }]} allowFontScaling={false}>
        {(tile as BombTile).fuse}
      </Text>
    </View>
    {/* Only the play page's player overlay draws this, so the spark always runs. */}
    <FuseSpark tileSize={tileSize} fuse={(tile as BombTile).fuse} />
  </>;
}

const styles = StyleSheet.create({
  entityContainer: {
    position: "absolute",
    paddingTop: "17.5%",
    paddingRight: "5%",
    justifyContent: "center",
    alignItems: "center",
  },
  entity: {
    fontFamily: "Montserrat-Regular",
    fontWeight: "normal",
    color: "white",
  },
});