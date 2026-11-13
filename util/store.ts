import { useSyncExternalStore } from "react";
import { Level, UserLevel } from "./types";

/**
 * App-wide state shared outside the React tree (loader.ts updates it after writing
 * to storage) or across distant components. Replaces the old
 * DeviceEventEmitter bus: actions read the current state directly, so there are no
 * listeners holding stale closures.
 */
export interface AppState {
  levels: Level[], // Every stored level, official and custom.
  editorLevel?: UserLevel, // The level open in the editor.
  notificationCounts: number[], // Badge counts for the home menu pages.

  scrollToBottom: boolean, // Ask the Levels page to scroll to its last level.
  subpageRequest?: { index: number, id: number }, // Ask the mounted Subpages to switch tab.
  initialSubpage?: number, // The tab a freshly mounted Subpages should start on.
  pageAnimating: boolean, // The page panel is sliding in.
  pageOpenedCount: number, // Increments each time the page panel finishes sliding in.
}

type Listener = () => void;

let state: AppState = {
  levels: [],
  notificationCounts: [0, 0, 0, 0],
  scrollToBottom: false,
  pageAnimating: false,
  pageOpenedCount: 0,
};
const listeners = new Set<Listener>();

export function getAppState() {
  return state;
}

export function setAppState(update: Partial<AppState> | ((current: AppState) => Partial<AppState>)) {
  const partial = typeof update === "function" ? update(state) : update;
  state = { ...state, ...partial };
  listeners.forEach(listener => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Subscribes to one slice of the app state. The selector must return a stable value. */
export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// ---------- Actions ----------

export function setEditorLevel(level: UserLevel | undefined) {
  setAppState({ editorLevel: level });
}

/** Adds change to a badge count, or clears it if change is 0. */
export function updateNotificationCount(index: number, change: number) {
  setAppState(({ notificationCounts }) => ({
    notificationCounts: notificationCounts.map((count, i) => i !== index ? count : change === 0 ? 0 : count + change),
  }));
}

let subpageRequestId = 0;
/** Switches the mounted Subpages to a tab. */
export function requestSubpage(index: number) {
  setAppState({ subpageRequest: { index, id: ++subpageRequestId } });
}

/** Called by Subpages whenever the visible tab changes. */
export function subpageChanged() {
  if (state.scrollToBottom) setAppState({ scrollToBottom: false });
}

/** The tab a newly mounted Subpages should start on; consumed once. */
export function takeInitialSubpage() {
  const page = state.initialSubpage;
  if (page !== undefined) state = { ...state, initialSubpage: undefined }; // Not rendered, no need to notify.
  return page;
}

export function pageOpened() {
  setAppState(({ pageOpenedCount }) => ({ pageAnimating: false, pageOpenedCount: pageOpenedCount + 1 }));
}
