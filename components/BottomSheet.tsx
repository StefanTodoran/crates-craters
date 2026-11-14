import { useContext, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import GlobalContext from "../GlobalContext";
import { normalize } from "../TextStyles";
import { colors } from "../Theme";
import { prepareNextSheet } from "../modules/sheet-detents";

interface Props {
  visible: boolean,
  onClose: () => void, // Swipe down, tap outside, or the Android back button.
  children: React.ReactNode,
  contentStyle?: object, // For the scrolling content.
}

/**
 * A sheet from the bottom of the screen. iOS: the system page sheet at half height,
 * draggable to full, on the see-through sheet material. Android: a panel over a dimmed
 * backdrop. Tapping outside closes both.
 */
export default function BottomSheet({ visible, onClose, children, contentStyle }: Props) {
  const { darkMode } = useContext(GlobalContext);

  // The sheet's detents must be set before it's presented, so do it in the render that
  // opens it (the native call is synchronous, and the Modal mounts after this render).
  const wasVisible = useRef(false);
  if (ios && visible && !wasVisible.current) prepareNextSheet();
  wasVisible.current = visible;

  if (ios) return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onClose}
      backdropColor="transparent" // Modal paints white over the sheet material otherwise.
    >
      <ScrollView style={styles.transparent} contentContainerStyle={contentStyle}>
        {children}
      </ScrollView>
    </Modal>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      <View style={[styles.panel, { backgroundColor: darkMode ? colors.NEAR_BLACK : colors.OFF_WHITE }]}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={contentStyle}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const ios = Platform.OS === "ios";

const styles = StyleSheet.create({
  transparent: {
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88%",
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    paddingTop: normalize(8),
    elevation: 12,
  },
  grabber: {
    alignSelf: "center",
    width: normalize(40),
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.DIM_GRAY,
    opacity: 0.4,
  },
});
