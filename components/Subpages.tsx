import { useContext, useEffect, useRef, useState } from "react";
import GlobalContext from "../GlobalContext";
import { Animated, ImageURISource, StyleSheet, View, Platform } from "react-native";
import TabView from "react-native-bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SFSymbol } from "sf-symbols-typescript";
import { normalize } from "../TextStyles";
import { colors, tintFor } from "../Theme";
import { eventEmitter, takeInitialSubpage } from "../util/events";
import IconButton from "./IconButton";

/** Extra bottom padding scrolling pages need so their end clears the floating iOS tab bar. */
export const TAB_BAR_CLEARANCE = Platform.OS === "ios" ? 80 : 0;

export interface SubpageTab {
  label: string,
  color: string,
  icon?: ImageURISource,
  sfSymbol?: SFSymbol, // iOS native tab bar icon; falls back to `icon`.
}

interface Props {
  pageTabs: SubpageTab[],
  pageComponents: React.ReactNode[],
  disabledPages?: boolean[],
}

export default function Subpages(props: Props) {
  // iOS gets the native tab bar (Liquid Glass on iOS 26+); Android keeps the custom one.
  return Platform.OS === "ios" ? <NativeSubpages {...props} /> : <CustomSubpages {...props} />;
}

function NativeSubpages({ pageTabs, pageComponents, disabledPages }: Props) {
  // App pads the whole screen by the bottom inset; the native tab bar handles the home
  // indicator itself, so extend it down into that padding.
  const insets = useSafeAreaInsets();
  const { darkMode } = useContext(GlobalContext);
  const [index, setIndex] = useState(() => {
    const initial = takeInitialSubpage() ?? 0;
    return initial < pageComponents.length ? initial : 0;
  });

  useEffect(() => {
    const listener = eventEmitter.addListener("doPageChange", (newIndex: number) => {
      setIndex(newIndex);
      eventEmitter.emit("pageWasChanged");
    });
    return () => listener.remove();
  }, []);

  const routes = pageTabs.map((tab, tabIndex) => ({
    key: String(tabIndex),
    title: tab.label,
    focusedIcon: tab.sfSymbol ? { sfSymbol: tab.sfSymbol } : tab.icon,
    activeTintColor: darkMode ? tab.color : tintFor(tab.color),
    preventsDefault: !!disabledPages?.[tabIndex],
  }));

  return (
    <View style={{ flex: 1, width: "100%", marginBottom: -insets.bottom }}>
    <TabView
      navigationState={{ index, routes }}
      onIndexChange={(newIndex) => {
        // preventsDefault only stops the native bar from switching; JS is still told about the press.
        if (disabledPages?.[newIndex]) return;
        setIndex(newIndex);
        eventEmitter.emit("pageWasChanged");
      }}
      renderScene={({ route }) => (
        // Native tab scenes have no background of their own.
        <View style={[styles.nativePage, { backgroundColor: darkMode ? "black" : "white" }]}>{pageComponents[Number(route.key)]}</View>
      )}
      tabBarActiveTintColor={pageTabs[index] && (darkMode ? pageTabs[index].color : tintFor(pageTabs[index].color))}
      tabBarInactiveTintColor={colors.DIM_GRAY}
      // iOS 26 Liquid Glass ignores the inactive tint unless the colors are baked into the tab images.
      experimental_bakedTintColors
      hapticFeedbackEnabled
    />
    </View>
  );
}

function CustomSubpages({ pageTabs, pageComponents, disabledPages }: Props) {
  const anim = useRef(new Animated.Value(1)).current;
  const setAnimTo = (animState: number, callback?: () => void) => {
    Animated.timing(anim, {
      toValue: animState, // MAKE SURE 0 <= animState <= 1
      duration: 150,
      useNativeDriver: true
    }).start(callback);
  }

  const [currentPage, setPage] = useState(() => {
    const initial = takeInitialSubpage() ?? 0;
    return initial < pageComponents.length ? initial : 0;
  });
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
    // On iOS the SafeAreaView already clears the home indicator.
    marginBottom: Platform.OS === "ios" ? normalize(4) : normalize(30),
    width: "100%",
    justifyContent: "center",
    borderTopWidth: 1,
    borderColor: colors.DIM_GRAY_TRANSPARENT(0.2),
  },
  nativePage: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
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