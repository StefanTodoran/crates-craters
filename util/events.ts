import { DeviceEventEmitter } from "react-native";
// JS-only event bus. NativeEventEmitter without a native module throws on iOS.
export const eventEmitter = DeviceEventEmitter;

export function doPageChange(pageIndex: number) {
  eventEmitter.emit("doPageChange", pageIndex);
}

export function doStateStorageSync(specificLevel?: string) {
  eventEmitter.emit("doStateStorageSync", specificLevel);
}

export function doNotificationsUpdate(index: number, change: number) {
  eventEmitter.emit("doNotificationsUpdate", { index: index, change: change });
}