import { Dimensions, ScrollView, StyleSheet } from "react-native";

const win = Dimensions.get("window");

interface Props {
  center?: boolean,
  children: React.ReactNode,
}

export default function SubpageContainer({ center, children }: Props) {
  return (
    <ScrollView
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      style={styles.scrollContainer}
      contentContainerStyle={[
        {
          paddingHorizontal: win.width * 0.05,
          paddingTop: win.height * 0.015,
          paddingBottom: win.height * 0.025,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    overflow: "hidden",
  },
});