import { useEffect, useRef, useState } from "react";
import { Animated, ImageURISource, StyleSheet, View } from "react-native";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";
import { eventEmitter } from "../util/events";
import IconButton from "./IconButton";

interface SubpageTab {
  label: string,
  color: string,
  icon: ImageURISource,
}

interface Props {
  pageTabs: SubpageTab[],
  pageComponents: React.ReactNode[],
  disabledPages?: boolean[],
}

export default function Subpages({ pageTabs, pageComponents, disabledPages }: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState, // MAKE SURE 0 <= animState <= 1
      duration: 150,
      useNativeDriver: true
    }).start(callback);
  }

  const [currentPage, setPage] = useState(0);
  const updatePageState = (newPageState: number) => {
    if (newPageState === currentPage) return;
    setAnimTo(0, () => {
      setPage(newPageState);
      setAnimTo(1);
      eventEmitter.emit("pageWasChanged");
    });
  }

  useEffect(() => {
    const listener = eventEmitter.addListener("doPageChange", updatePageState);
    return () => listener.remove();
  }, [currentPage, setPage]);

  return (
    <>
      <Animated.View style={styles.pageContainer(anim)}>
        {pageComponents[currentPage]}
      </Animated.View>

      <View style={styles.menu}>
        {pageTabs.map((pageTab, pageIndex) =>
          <IconButton
            key={pageIndex}
            active={pageIndex === currentPage}
            color={pageTab.color}
            label={pageTab.label}
            icon={pageTab.icon}
            onPress={() => updatePageState(pageIndex)}
            disabled={disabledPages && disabledPages[pageIndex]}
          />)}
      </View>
    </>
  );
}

const styles = StyleSheet.create<any>({
  menu: {
    position: "relative",
    flexDirection: "row",
    gap: normalize(20),
    marginBottom: normalize(30),
    width: "100%",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.2),
  },
  pageContainer: (anim: Animated.Value) => ({
    flex: 1,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    opacity: anim,
  }),
});