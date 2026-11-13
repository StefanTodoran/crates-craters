import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { TAB_BAR_CLEARANCE } from "./Subpages";

interface Props {
  center?: boolean,
  noWidthPad?: boolean,
  onRefresh?: (onFinish: () => void) => void,
  lessTopPad?: boolean,
  children: React.ReactNode,
}

export default function SubpageContainer({ center, noWidthPad, onRefresh, lessTopPad, children }: Props) {
  const win = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const finishRefresh = () => setRefreshing(false);

  return (
    <ScrollView
      // overScrollMode="never"
      showsVerticalScrollIndicator={false}
      style={styles.scrollContainer}
      refreshControl={onRefresh && (
        <RefreshControl refreshing={refreshing} onRefresh={() => onRefresh(finishRefresh)} />
      )}
      contentContainerStyle={[
        {
          paddingTop: lessTopPad ? win.height * 0.025 : win.height * 0.05,
          paddingBottom: win.height * 0.05 + TAB_BAR_CLEARANCE,
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