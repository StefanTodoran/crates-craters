import { Dimensions, ScrollView, StyleSheet } from "react-native";

const win = Dimensions.get("window");

interface Props {
  center?: boolean,
  noWidthPad?: boolean,
  children: React.ReactNode,
}

export default function SubpageContainer({ center, noWidthPad, children }: Props) {
  return (
    <ScrollView
      // overScrollMode="never"
      showsVerticalScrollIndicator={false}
      style={styles.scrollContainer}
      contentContainerStyle={[
        {
          paddingTop: win.height * 0.05,
          paddingBottom: win.height * 0.05,
        },
        !noWidthPad && {
          paddingHorizontal: win.width * 0.05,
        },
        center && {
          justifyContent: "center",
          minHeight: "100%",
        },
      ]}>{children}</ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    overflow: "hidden",
  },
});