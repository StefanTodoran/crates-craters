import { useCallback, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { pageOpened, requestSubpage, setAppState } from "./store";
import { PageView } from "./types";

interface Options {
  onNavigate: (from: PageView, to: PageView) => void, // Runs as soon as a switch is requested.
  onPageOpen: (view: PageView) => void, // Runs when a page starts opening (after the old one closed).
}

/**
 * Owns the current page and the page panel's slide animation. switchView is stable,
 * so it can be passed to memoized components.
 *
 * PAGE -> MENU slides the panel out, MENU -> PAGE slides the new page in, and
 * PAGE -> PAGE slides out then in (or only switches tab if it's the same page).
 */
export function usePageNavigation({ onNavigate, onPageOpen }: Options) {
  const [view, setView] = useState(PageView.MENU);
  const pageAnim = useRef(new Animated.Value(0)).current;

  const latest = useRef({ view, onNavigate, onPageOpen });
  latest.current = { view, onNavigate, onPageOpen };

  const animateTo = useCallback((value: number, callback?: () => void) => {
    // Interpolated styles assume 0 <= value <= 1.
    Animated.timing(pageAnim, { toValue: value, duration: 300, useNativeDriver: true }).start(callback);
  }, []);

  // Start the slide only once the new page has rendered. The slide runs on the native
  // driver, so starting it immediately let it finish while JS was still mounting the
  // page, leaving an empty panel that filled in at the end.
  const pendingOpen = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const start = pendingOpen.current;
    if (!start) return;
    pendingOpen.current = undefined;
    requestAnimationFrame(start); // Wait one frame after the commit so the page is on screen.
  }, [view]);

  const openPage = useCallback((newView: PageView, pageNum: number | undefined, sameView: boolean) => {
    // A freshly mounted page's Subpages can start on the right tab instead of sliding in
    // tab 0 and cross-fading after the open animation.
    if (pageNum !== undefined && !sameView) setAppState({ initialSubpage: pageNum });
    setAppState({ pageAnimating: true });
    latest.current.onPageOpen(newView);

    const startOpen = () => animateTo(1, () => {
      if (pageNum !== undefined && sameView) requestSubpage(pageNum);
      pageOpened();
    });

    if (sameView) {
      startOpen(); // Already mounted, nothing to wait for.
    } else {
      pendingOpen.current = startOpen;
      setView(newView);
    }
  }, []);

  const switchView = useCallback((newView: PageView, pageNum?: number) => {
    const from = latest.current.view;
    latest.current.onNavigate(from, newView);

    if (newView === PageView.MENU) {
      animateTo(0, () => setView(newView));
    } else if (from === PageView.MENU) {
      openPage(newView, pageNum, false);
    } else {
      animateTo(0, () => openPage(newView, pageNum, newView === from));
    }
  }, []);

  return { view, pageAnim, switchView };
}
