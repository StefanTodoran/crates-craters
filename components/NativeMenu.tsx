import { MenuAction, MenuView } from "@react-native-menu/menu";
import { ReactNode, useContext } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";
import GlobalContext from "../GlobalContext";

export interface NativeMenuItem {
  id: string,
  title: string,
  sfSymbol?: string, // iOS icon. Android menus are text-only here (they need drawable resources).
  destructive?: boolean,
  disabled?: boolean,
  checked?: boolean, // Shows a checkmark.
  onPress: () => void,
}

interface Props {
  items: NativeMenuItem[],
  title?: string,
  openOnLongPress?: boolean, // Long press opens it (a context menu); otherwise a tap does.
  style?: StyleProp<ViewStyle>,
  children: ReactNode,
}

/**
 * A system menu (UIMenu with the iOS 26 glass look, a Material popup on Android)
 * anchored to its children. The children are only the visual: touches go to the
 * native view, so they shouldn't handle presses themselves.
 */
export default function NativeMenu({ items, title, openOnLongPress, style, children }: Props) {
  const { darkMode } = useContext(GlobalContext);

  const actions: MenuAction[] = items.map(item => ({
    id: item.id,
    title: item.title,
    image: Platform.OS === "ios" ? item.sfSymbol : undefined,
    attributes: { destructive: item.destructive, disabled: item.disabled },
    state: item.checked ? "on" : undefined,
  }));

  return (
    <MenuView
      title={title}
      actions={actions}
      shouldOpenOnLongPress={openOnLongPress}
      themeVariant={darkMode ? "dark" : "light"}
      onPressAction={({ nativeEvent }) => items.find(item => item.id === nativeEvent.event)?.onPress()}
      style={style}
    >
      {openOnLongPress ? children : <View pointerEvents="none">{children}</View>}
    </MenuView>
  );
}
