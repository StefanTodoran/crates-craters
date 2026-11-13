import { requireNativeViewManager, requireOptionalNativeModule } from "expo-modules-core";
import { Platform, StyleProp, ViewStyle } from "react-native";

const module = Platform.OS === "ios"
  ? requireOptionalNativeModule<{ isAvailable: boolean }>("GlassView")
  : null;

/** Whether the system Liquid Glass material is available (iOS 26 and later). */
export const glassAvailable = !!module?.isAvailable;

interface GlassViewProps {
  style?: StyleProp<ViewStyle>,
  tint?: string, // Tints the glass, e.g. for a selected state.
  cornerRadius?: number, // Omitted: a capsule.
}

const NativeGlassView: React.ComponentType<GlassViewProps & { pointerEvents?: "none" }> | null =
  module ? requireNativeViewManager("GlassView") : null;

/**
 * The Liquid Glass material. Has no children: place it behind content with an absolute
 * fill. Renders nothing where glass isn't available, so check `glassAvailable` first.
 */
export function GlassView(props: GlassViewProps) {
  if (!NativeGlassView || !glassAvailable) return null;
  return <NativeGlassView pointerEvents="none" {...props} />;
}
