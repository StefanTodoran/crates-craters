import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

const SheetDetents = Platform.OS === "ios"
  ? requireOptionalNativeModule<{ prepareNextSheet(clearBackground: boolean): void }>("SheetDetents")
  : null;

/**
 * Makes the next page sheet Modal open at half height (draggable to full) with a
 * see-through background. Call right before setting the Modal visible. No-op on
 * Android, or on a build without the native module.
 */
export function prepareNextSheet(clearBackground = true) {
  SheetDetents?.prepareNextSheet(clearBackground);
}
