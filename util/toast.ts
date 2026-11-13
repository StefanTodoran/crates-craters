import * as Burnt from "burnt";
import { Platform } from "react-native";

interface ToastOptions {
  type?: "success" | "error" | "info",
  text1: string,
  text2?: string,
}

/**
 * Native toasts: the system-style pill (with icon and haptic) on iOS and a system
 * toast on Android. Keeps react-native-toast-message's show() signature, so call
 * sites only change their import.
 */
const Toast = {
  show({ type = "success", text1, text2 }: ToastOptions) {
    // Android's system toast is a single line of text, so the two parts are joined.
    const title = Platform.OS === "android" && text2 ? `${text1} ${text2}` : text1;
    Burnt.toast({
      title,
      message: text2,
      preset: type === "success" ? "done" : type === "error" ? "error" : "none",
      haptic: type === "success" ? "success" : type === "error" ? "error" : "none",
      from: "top",
    });
  },
};

export default Toast;
