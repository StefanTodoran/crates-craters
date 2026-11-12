import { DeviceEventEmitter } from "react-native";
// JS-only event bus. NativeEventEmitter without a native module throws on iOS.
export const eventEmitter = DeviceEventEmitter;

export function doPageChange(pageIndex: number) {
  eventEmitter.emit("doPageChange", pageIndex);
}

// The sub-page a freshly mounted Subpages should start on (set right before opening a page).
let initialSubpage: number | undefined;
export function setInitialSubpage(pageIndex: number) {
  initialSubpage = pageIndex;
}
export function takeInitialSubpage() {
  const page = initialSubpage;
  initialSubpage = undefined;
  return page;
}

// Fired when the page panel finishes sliding in, so views can re-measure positions
// that were wrong while the panel was still translated.
export function doPageOpened() {
  pageAnimating = false;
  eventEmitter.emit("pageOpened");
}

// True while the page panel is sliding in. Components mounting during the slide
// can skip their own entrance animations so they move with the panel.
let pageAnimating = false;
export function setPageAnimating() {
  pageAnimating = true;
}
export function isPageAnimating() {
  return pageAnimating;
}

export function doStateStorageSync(specificLevel?: string) {
  eventEmitter.emit("doStateStorageSync", specificLevel);
}

export function doNotificationsUpdate(index: number, change: number) {
  eventEmitter.emit("doNotificationsUpdate", { index: index, change: change });
}