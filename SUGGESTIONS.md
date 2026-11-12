# Suggestions

Open items from `APP_REVIEW.md`, plus a few found since. The 15 quick-win fixes, the lock icon work, all earlier bug items, and the security review fixes are done and aren't listed here. Items are grouped by type and numbered continuously. Each one is standalone, so edit or delete freely.

## Security

1. [Deferred] App Check isn't enabled. The Firebase API key is in a public repo (normal for Firebase), so the rules are the only defense, and any script can call Firestore directly. Enable App Check (App Attest on iOS, Play Integrity on Android) and enforce it for Firestore. Also restrict the API key to your bundle and package IDs in the Cloud console. This needs `@react-native-firebase/app-check` (the JS SDK has no native providers) and a paid Apple developer account for App Attest. Enforcing it locks out old app versions.

## Performance

2. Every drag event re-renders the whole board (`PlayLevel.tsx:212-223`). Drive the drag preview with an `Animated.ValueXY`, `React.memo` the `GameBoard`, and render `Player` as a sibling overlay.

3. Game state lives in App, so every move re-renders App, the hidden Menu and every context consumer.
    - Memoize the context value and the `levels.filter(...)` lists.
    - `memo` the Menu.
    - Move game state down or into a reducer.

4. The editor clones the board on every pan event, even when the finger hasn't changed tile (`EditLevel.tsx:128-181`). Skip the update if the tile is unchanged.

5. The Menu scroll drives `anim.setValue` from JS (`Menu.tsx:98-100`). Use `Animated.event` with `useNativeDriver: true`, and hoist the interpolations into `useMemo`. The same pattern appears in `App.tsx`, `PlayLevel.tsx` and `Player.tsx`.

6. `UserLevels` does 3 MMKV reads plus `JSON.parse` on every render, including search keystrokes (`UserLevels.tsx:111-113`, `149-160`). Memoize them.

7. The `LevelCard` memo never helps, because it gets new callbacks, `stats` and `children` every render. `getItemLayout` ignores the list header's height (`LevelSelect.tsx:224`).

8. Undo history stores a full deep clone of the game per move, with no limit (`PlayLevel.tsx:72`). Cap it, or store moves and replay them.

## Code Quality

9. `normalize()` subtracts a flat 4pt on iOS after scaling (`TextStyles.ts:8-15`), so `normalize(4)` is about 0. Scale only.

10. Split the god components (App, PlayLevel, EditLevel, UserLevels).
    - Extract a `useGameInput` hook, a `ToolPicker` component, `buildUserLevelQuery()`, and a navigation reducer.
    - The fade-modal logic is duplicated three times.

11. Replace the global `DeviceEventEmitter` bus and the functions-stored-in-refs pattern with a small store (zustand, or a context with a reducer). They're the source of most stale-closure bugs.

12. `StyleSheet.create<any>` with function-styles turns off style type-checking. Use typed style functions, memoized where they're hot.

13. Clean up typing: remove `@ts-expect-error` workarounds, replace `any` in `database.ts`, and convert the `.js` pages to TS.

14. `Dimensions.get("window")` is read at module scope in nearly every file, so nothing responds to rotation, split-screen or font scaling. Use `useWindowDimensions()`.

15. `GameBoard.tsx:65` throws in render with a `[object Object]` message, and the sort comparator at `loader.ts:117` isn't transitive.

## Tooling

16. `tsc` doesn't type-check anything as configured: `"moduleResolution": "Node"` clashes with Expo's base tsconfig and stops on a config error. Switch to `"bundler"` and exclude `dev/dist`.

17. The iOS version in `Info.plist` is still 0.4.18 while `package.json` is 0.4.22. Bump it with each release.

18. `npx expo run:ios` fails with "Can't determine id of Simulator app", even though Xcode is selected. Builds work through `xcodebuild` directly.

## Assets

19. Icons are exported at 1× (100×100 px) but shown at up to ~3× density, so they're slightly soft on iPhones. Consider exporting `@2x`/`@3x` variants.

## UI

20. Tutorial hint card: its buttons don't line up with the faded Back/Help/Menu bar underneath, and the movement diagram's bottom arrow sticks out past the card.

21. The editor shows "Level title is required!" before anything has been typed. Show it only after the field has been touched.

22. Hide the coin counter on levels with no coins (it shows "0/0").

23. The win screen has no Menu button, only Back and Next Level.

24. The in-game menu has no backdrop, and tapping outside it doesn't close it.

25. Home menu:
    - The page dots are tiny and white.
    - About 40% of the screen is empty.
    - Nothing hints that you can swipe.
    - There's no progress or coin balance.

26. Header logo: low-contrast text over busy art, and it uses about 120pt on every page. The top-left icon on Levels is unclear.

27. Menu and tool-picker buttons have the icon on the left and the text pushed far right. Center the content, or place the label next to the icon.

28. The grey card header bars (Profile, Create Level, Manage) clash with the pastel theme and look disabled.

29. The EDIT BOARD dark-grey wash makes the preview look disabled. Try a lighter wash or a small "✎ Edit board" pill.

30. Game screen:
    - The move count and best are tiny grey corner text.
    - The `/5` coin counter is a faint subscript.
    - There's dead space above the board.

31. Editor walls render as isolated squares instead of joined walls as in play.

32. Tool picker:
    - Metal Crate and Diamond are filed under "Bomb Tiles".
    - The current tool isn't highlighted.
    - Save, Discard and Playtest are buried in the menu.

33. Sub-page tab bars: only the active tab is labelled, and the share and settings icons are ambiguous. Label every tab or none.

34. Profile shows the raw UID, and "Resend Email" still appears after "Email verified".

## Features

35. Add undo and an eraser to the editor.

36. Show overall progress on the Levels page (e.g. "5/30 complete").

37. Trim the Guide's wall of text and lean on in-context tutorial hints instead.
