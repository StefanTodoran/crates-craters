import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

const SheetDetents = Platform.OS === "ios"
  ? requireOptionalNativeModule<{ configurePresentedSheet(clearBackground: boolean): Promise<void> }>("SheetDetents")
  : null;

/**
 * Makes the page sheet currently on screen open at half height (draggable to full) with
 * a see-through background. Call from a Modal's onShow. No-op on Android, or on a build
 * without the native module.
 */
export function configurePresentedSheet(clearBackground = true) {
  return SheetDetents?.configurePresentedSheet(clearBackground);
}
