import { NativeEventEmitter } from "react-native";
export const eventEmitter = new NativeEventEmitter();

export function doPageChange(pageIndex: number) {
  eventEmitter.emit("doPageChange", pageIndex);
}

export function doStateStorageSync(specificLevel?: string) {
  eventEmitter.emit("doStateStorageSync", specificLevel);
}

export function doNotificationsUpdate(index: number, change: number) {
  eventEmitter.emit("doNotificationsUpdate", { index: index, change: change });
}