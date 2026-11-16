# Crates & Craters — App Review (iOS, iPhone 18 Pro simulator)

Reviewed on branch `diamond_tiles` by driving the app in the iPhone 18 Pro simulator (iOS 27.2) with AXe and reading the code. Line numbers are from that branch's HEAD at review time.

---

## 1. Known issues — root causes and fixes

### 1.1 Page-open animation: the container and its children move separately
In a frame-by-frame recording, an empty, see-through white sheet slides up, and the content pops in at the end. Four things stack up:
- **The safe-area inset is recalculated mid-slide.** `App.tsx:268` puts an RN `<SafeAreaView>` inside the `Animated.View` that is translated from `win.height * 0.2` to 0. As the view slides under the Dynamic Island, iOS reports new insets and padding is re-applied asynchronously, so the content jumps by about 59pt at a different moment from the sheet. The nested SafeAreaViews in `PlayLevel.tsx:383` and `EditLevel.tsx:219` have the same problem.
  - Fix: install `react-native-safe-area-context`, wrap the app in `SafeAreaProvider`, read `useSafeAreaInsets()` once, and apply static padding outside the animated subtree.
- **The header's opacity is applied twice.** The header (`App.tsx:273`, `389-397`) has `opacity: anim` inside a modal that also has `opacity: anim`, so its effective opacity is anim². It visibly lags the panel (25% when the panel is at 50%).
  - Fix: remove `opacity` from `styles.header`.
- **Sub-tab pages cross-fade after the slide.** `doPageChange(pageNum)` only fires after the 300ms open animation finishes (`App.tsx:69-71`, `Subpages.tsx:31-43`). Opening on tab 1 therefore shows tab 0 first, then a 150+150ms cross-fade.
  - Fix: give `Subpages` an `initialPage` prop and set it synchronously before the animation starts.
- **Each LevelCard runs its own mount animation.** Every card fades and scales over 200ms on mount (`LevelCard.tsx:44-52`), overlapping the slide. The modal's animated `borderRadius` (`App.tsx:405`) has no `overflow: "hidden"`, so children aren't clipped to it.
  - Fix: skip the card mount animation during page transitions, and add `overflow: "hidden"`.

### 1.2 TextInput looks wrong when focused on iOS
On Profile ("Username") and the Editor ("Level Title"), the floating label moves up into the card's grey title bar and gets clipped, and the typed text sits on the underline. `components/InputLine.tsx:57-138` is tuned around Android's TextInput, which has about 10dp of default vertical padding. iOS has none.
- The label is `position: absolute, top: "50%"` with no `-height/2` correction (line 111).
- On focus, the label moves up a fixed `-12` (line 123) and the input moves down a fixed `+5` (lines 58-63).
- `fontSize` is animated with `useNativeDriver: false` (line 43), so text is re-laid out on the JS thread every frame.
- `onChangeText` calls `setFocus(true)` redundantly (line 74).
- Fix: give the TextInput explicit, identical geometry on both platforms (`paddingVertical: 0`, fixed `height`/`lineHeight`). Position the label from that known height. Animate the label with native-driver `transform: [{ translateY }, { scale }]` instead of `fontSize`. Remove the input's `translateY`.
- Also seen: typing "Test Level" produced "Tet Level". This may be the automation typing too fast, or the controlled input dropping a keystroke. Verify by hand.

### 1.3 Toasts overlap the Dynamic Island
`App.tsx:360-366` wraps `<Toast>` in a `SafeAreaView`, which does nothing. The toast container is `position: 'absolute'` and is placed with the library's default `topOffset` of 40pt; the Dynamic Island inset is about 59pt. The toast also stays visible across page changes, covering the clock and the Home button.
- Fix: `<Toast topOffset={insets.top + 8} config={toastConfig} />`, rendered outside any SafeAreaView, with `insets` from `useSafeAreaInsets()`.
- The `bottomOffset={20}` has no effect with `position="top"`; drop it.

### 1.4 "EDIT BOARD" text sits at the top of the preview on iOS
`pages/ManageLevel.tsx:131-139` and the `previewOverlay` style at `:215-223`: the overlay is a single `<Text>` filling the preview, centred with `textAlignVertical: "center"`. That property is **Android-only**; on iOS, text always starts at the top of its box. A `<Text>` with `borderRadius` and a background also isn't reliably clipped on iOS.
- Fix: make the overlay a `View` with `...StyleSheet.absoluteFillObject`, `justifyContent: "center"`, `alignItems: "center"`, `borderRadius`, `overflow: "hidden"` and the translucent background, and put a plain `<Text>` inside it.
- The dark-grey wash over a pastel board also makes the preview look disabled. A lighter wash, or a small "✎ Edit board" pill in the middle, would read better.

### 1.5 Move indicators wrong after a double-tap jump
**Reproduced:** on level 1, after moving right 3 times and then double-tapping the tile left of the flag, indicators showed on the **wall above** and on the **flag to the right** (only 3/5 coins collected, so neither move is valid). It happened on 1 of 4 attempts, so it's intermittent.

The move-validity logic is correct (`logic.ts:360 isValidMove`), and `Player` recomputes options from `game`. The problem is in how the indicator's opacity is rendered (`components/Player.tsx:66-67` and `:236-240`):
```ts
opacity: valid ? anim.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.3] }) : 0,
```
The same `Animated.View` (keyed by index) switches its `opacity` prop between a **native-driven animated node** and the **plain number 0**. When a native-driven node is detached, React Native doesn't reliably write the static value back to the native view, so the view can keep its last animated opacity. A single move rarely flips a direction from valid to invalid exactly in that window. A jump moves the player many tiles in one state update, which makes stale indicators much more likely. The code comment at lines 62-65 ("results in the animation breaking sometimes") is the same bug showing up.
- Fix: never swap the animated prop. Either:
  - put the static visibility on a wrapper — `<View style={{ opacity: valid ? 1 : 0 }}><Animated.View style={{ opacity: interp }} /></View>`, or
  - always animate, e.g. `opacity: Animated.multiply(interp, validValue)` with a per-slot `Animated.Value` set to 0 or 1.
- Related: `Player.tsx:26-41` starts `Animated.loop(...)` on every `game.won` change with no cleanup, so several loops end up driving the same value. Return `() => loop.stop()`.
- Related: `PlayLevel.tsx:139-208`. `onGestureStart` is rebuilt only on `[game]`, so the `pathFollowed.length === 0` guard always sees `[]` and never blocks. Swipes during a jump are accepted, then overwritten when the jump finishes (`updateGameState(current)` writes the game as it was when the jump started). Disable input while a jump is in progress and keep `pathFollowed` in a ref.

---

## 2. Other UI bugs found
- **Ice Block, Metal Crate and Diamond are invisible on the iOS board.** The iOS SVG path (`assets/Icons.tsx:11-60`, used by `GameBoard.tsx:29/67`) has no cases for `METAL_CRATE`, `ICE_BLOCK` or `DIAMOND`. In the editor they render as a blank cell that breaks the checker pattern; the Diamond shows only its glint sparkles. `ONEWAY` always uses `OneWayUpIcon`, so other orientations are drawn wrong.
- **The tutorial hint card sits on top of the Back/Help/Menu bar.** Its own buttons don't line up with the faded ones underneath, and the arrow diagram's bottom arrow sticks out past the card.
- **Level 1's tutorial shows again on every replay**, even after the level is completed. `PlayLevel.tsx:309` `useState(introducesMechanics)` also doesn't reset when the level changes (TODO in the code).
- **The editor shows "Level title is required!" before anything has been typed.**
- **Levels with no coins show a "0/0" coin counter** (e.g. level 2). Hide it when `maxCoins === 0`.
- **The win screen has no Menu button**, only Back and Next Level.
- **The in-game menu has no backdrop, and tapping outside it doesn't close it.**
- **Settings don't persist `false` or `0`.** `util/hooks.ts:33/45` use `storedValue || defaultValue`, so turning audio off is undone on restart. Use `??`.

## 3. Visual / design — needs a revamp
- **Home menu:**
  - The thin white labels have very low contrast (PROFILE on yellow is nearly invisible).
  - The page dots are tiny and white.
  - About 40% of the screen is empty.
  - Nothing hints that you can swipe, and there's no progress or coin balance.
- **Header logo:** low-contrast text over busy background art, and it uses about 120pt on every page. The top-left icon on Levels is unclear.
- **Buttons:** in-menu and tool-picker buttons have the icon on the left and the text pushed far right, leaving a gap. The tool picker is a rainbow of outlined buttons that's visually noisy.
- **Card headers:** the grey header bars (Profile, Create Level, Manage) clash with the pastel theme and look disabled.
- **Game screen:**
  - The move count and best ("3 moves", "32 best") are tiny grey text in the corners.
  - The `/5` coin counter is a faint subscript.
  - There's dead space between the status bar and the board.
- **Editor board:** placed walls render as isolated squares instead of joined walls as in play.

## 4. Could be simplified
- **Tool picker:**
  - Metal Crate and Diamond are filed under "Bomb Tiles".
  - The current tool isn't highlighted.
  - Save, Discard and Playtest are buried inside the tool menu.
  - Consider a compact icon grid or a bottom palette.
- **Sub-page tab bars:** only the active tab shows a label, and the share and settings icons are ambiguous. Label every tab or none.
- **Profile:** showing the raw UID is developer info. "Resend Email" still shows after "Email verified".

## 5. Lacking
- No undo or eraser in the editor.
- Locked levels look the same as unlocked ones apart from the button. There's no overall progress such as "5/30 complete".
- The guide is a long wall of text. The in-context tutorial hints already work better; lean on them.

---

## 6. Performance
- **HIGH — every drag event re-renders the whole board.** `PlayLevel.tsx:212-223` calls `setTouchMove` on each pan move, which re-renders PlayLevel, the full GameBoard (8×14 tiles × 2 layers; on iOS each tile is an SVG), Inventory and MoveCounter at about 60Hz.
  - Fix: drive the drag preview from an `Animated.ValueXY`, wrap GameBoard in `React.memo`, and render Player as a sibling overlay rather than as `children`.
- **HIGH — Firestore debug logging ships in production.** `util/database.ts:9` calls `setLogLevel("debug")`. Gate it on `__DEV__`.
- **MED-HIGH — every move re-renders App, the hidden Menu and every context consumer.** Game state and history live in App (`App.tsx:151-153`). The context `value={{...}}` is a new object on every render, and `levels.filter(...)` (`:291`, `:318`) creates new arrays each render, which resets LevelSelect's `loadedLevels` (`LevelSelect.tsx:94`).
  - Fix: memoize the context value and the filtered lists, `memo` the Menu, and move game state down.
- **MED — the editor clones the board on every pan event** (`EditLevel.tsx:128-181`), even when the finger is still on the same tile.
- **MED — Menu animations run on the JS thread.** The scroll calls `anim.setValue` from JS (`Menu.tsx:98-100`), and interpolations are recreated every render. Use `Animated.event` with `useNativeDriver: true` and hoist the interpolations into `useMemo`. The same pattern appears in `App.tsx:399-415`, `PlayLevel.tsx:495-540` and `Player.tsx:230-254`.
- **MED — UserLevels reads storage on every render.** It does 3 MMKV reads plus `JSON.parse` per render, including every search keystroke (`UserLevels.tsx:111-113`, `149-160`).
- **LOW-MED — the LevelCard memo never helps.** `LevelCard` is `memo`'d, but it gets new callbacks, `stats` and `children` every render. `getItemLayout` (`LevelSelect.tsx:224`) ignores the list header's height, so `scrollToIndex` lands in the wrong place in UserLevels.
- **LOW — undo history is unbounded.** It stores a full deep clone of the game per move (`PlayLevel.tsx:72`).

## 7. Code — correctness, security, architecture
**High**
- **Plaintext password in MMKV.** The password is stored unencrypted for auto-login (`LoginPage.tsx:135/193`, `App.tsx:124-136`). The underlying cause is `firebase.ts:20` `initializeAuth(app)` with no persistence.
  - Fix: `initializeAuth(app, { persistence: getReactNativePersistence(...) })` with `onAuthStateChanged`, and delete the stored credentials.
- **User-level filters query a field that doesn't exist.** `UserLevels.tsx:194-203` queries a `uuid` field that `publishUserLevel` never writes; it is only added client-side (`database.ts:415`).
  - Liked, Played and Completed (`in`) return nothing. "New to You" (`not-in`) excludes every document.
  - Fix: use `where(documentId(), "in", chunk)` with chunks of 30 or fewer.
  - Firestore also rejects `not-in` combined with `!=` (`:191`). That error is swallowed by the bare `catch` (`:235`).
- **Side effects inside Firestore transactions.** `database.ts:113-125`, `146-158`, `182-214` push to local arrays and write MMKV inside `runTransaction`, which can retry. That can duplicate entries, and writes the local copy before the commit succeeds. The code also overwrites the server arrays with the local array, clobbering data from other devices.
  - Fix: do the local writes after the transaction resolves, and use `arrayUnion` / `increment`.
- **Discard after Save restores the wrong board.** `EditLevel.tsx:116-119` `discardChanges` is a `useCallback(..., [])`, so it always restores the level as it was at mount. Save, then Discard, then Exit writes the old board while keeping `completed = true` and the old `bestSolution`. The level can then be published with a solution that doesn't match its board.
- **Level-sync state bugs.** `App.tsx:157-174` `syncLevelStateWithStorage`:
  - It mutates state in place (`levels[levelIndex] = ...`) with no `setLevels`, and can write `levels[-1]`.
  - The `editorLevel` check is inverted: it clears the editor level when it *is* found in the list.
- **Unhandled rejections when offline.** `checkForOfficialLevelUpdates()` (`App.tsx:187`) has no `.catch`; it throws on every cold start without network (`database.ts:58-68`, `:366`). `getUserData` (`App.tsx:144`) also has no catch.

**Medium**
- **`postSolutionData` can't catch errors** (`database.ts:271-282`). It wraps a non-awaited promise in try/catch, so the catch never fires.
- **Winrate can crash the list.** It can exceed 1 or be Infinity (`database.ts:202`), and `getRange` then throws inside render (`UserLevels.tsx:54/368`).
- **Likes go wrong on failure.** The like count increments even when the like failed, and the shared object is mutated in place (`UserLevels.tsx:345-357`).
- **Responses can arrive out of order.** `fetchLevels` (`UserLevels.tsx:171-239`) has no request sequencing, so a slow older response overwrites a newer one. The data and count queries run one after the other; use `Promise.all`.
- **Pull-to-refresh uses stale filters.** `LevelSelect.tsx:102-121` `doRefresh` is `useCallback([])`, so it always uses the first render's filters.
- **`switchView` has incomplete dependencies.** `App.tsx:78-101` uses `[view]` but reads `playLevel`, `playMode` and `startEditingLevel`.
- **The undefined-level guard is dead code.** `EditLevel.tsx:124` dereferences `level` before the guard at `:212`; `loader.ts:47-52` crashes the same way on a missing key.
- **Board position is measured with a 1-second timer.** `setTimeout(measure, 1000)` (`PlayLevel.tsx:388-401`, `EditLevel.tsx:220-232`) means taps in the first second map to the wrong tiles, and the timer isn't cleared on unmount. Use `onLayout` + `measureInWindow`, or `locationX/locationY`.
- **"Next Level" can load a custom level.** `getNextLevel` (`App.tsx:216-220`) walks the unfiltered `levels`. After the last official level it loads a custom level in STANDARD mode, which then posts official solution data.
- **`normalize()` collapses small values on iOS.** `TextStyles.ts:8-15` subtracts a flat 4pt on iOS after scaling, so `normalize(4)` is about 0. That is part of why iOS spacing looks cramped.

**Low / architecture**
- **God components:** App (navigation, auth, level store, notifications, settings), PlayLevel, EditLevel (about 200 lines of tool-modal JSX) and UserLevels.
  - Extract a `useGameInput` hook, a `ToolPicker` component, `buildUserLevelQuery()`, and a navigation reducer.
  - The fade-modal logic is duplicated 3× (`EditLevel.tsx:85`, `UserLevels.tsx:90`, `PlayLevel.tsx:273`).
- **Event bus and refs instead of data flow.** The global `DeviceEventEmitter` bus (`util/events.ts`) plus functions stored in refs and updated by effects are the source of most stale-closure bugs. A small store (zustand, or a context with a reducer) would remove both.
- **Typing gaps:**
  - `StyleSheet.create<any>` with function-styles turns off style type-checking (App, Menu, InputLine, GameBoard, Player, PlayLevel, TextStyles).
  - `@ts-expect-error` is used to dodge typing (e.g. `ManageLevel.tsx:118/134`).
  - `any` appears in `database.ts`.
  - `.js` pages are mixed into a TS codebase.
- **Smaller issues:**
  - `Dimensions.get("window")` at module scope in nearly every file, so nothing responds to rotation, split-screen or font scaling.
  - `GameBoard.tsx:65` throws in render and prints `[object Object]`.
  - `loader.ts:117` has a non-transitive sort comparator.

## 8. Suggested order
1. Quick wins:
   - `??` in `hooks.ts`
   - gate `setLogLevel`
   - `.catch` on the startup update check
   - Toast `topOffset` from insets
   - remove the nested header opacity
   - EDIT BOARD overlay → centred View
   - indicator opacity wrapper
2. Move `SafeAreaView` out of the animated container; fix `InputLine` geometry on iOS.
3. Add the missing iOS SVG tiles (or fall back to PNG); fix one-way orientation.
4. Firestore: `documentId()` filters, transactions without side effects, auth persistence (remove the stored password).
5. Performance: Animated-driven drag preview, a memoized board, and game state moved out of App.
