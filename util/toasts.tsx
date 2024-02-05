import { BaseToast, ErrorToast } from "react-native-toast-message"
import { colors } from "../Theme";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.GREEN_THEME.MAIN_COLOR, paddingVertical: 10, height: "auto" }}
      text1Style={{
        fontSize: 14,
        fontFamily: "Montserrat-Regular",
        fontWeight: "normal",
      }}
      text2Style={{
        fontSize: 14,
        fontFamily: "Montserrat-Regular",
      }}
      text2NumberOfLines={2}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: colors.RED_THEME.MAIN_COLOR, paddingVertical: 10, height: "auto" }}
      text1Style={{
        fontSize: 14,
        fontFamily: "Montserrat-Regular",
        fontWeight: "normal",
      }}
      text2Style={{
        fontSize: 14,
        fontFamily: "Montserrat-Regular",
      }}
      text2NumberOfLines={2}
    />
  ),
};