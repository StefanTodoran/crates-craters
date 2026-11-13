# Suggestions

Open items from `APP_REVIEW.md`, plus a few found since. The 15 quick-win fixes, the lock icon work, all earlier bug items, the security review fixes, and the performance and code quality items are done and aren't listed here. Items are grouped by type and numbered continuously. Each one is standalone, so edit or delete freely.

## Security

1. [Deferred] App Check isn't enabled. The Firebase API key is in a public repo (normal for Firebase), so the rules are the only defense, and any script can call Firestore directly. Enable App Check (App Attest on iOS, Play Integrity on Android) and enforce it for Firestore. Also restrict the API key to your bundle and package IDs in the Cloud console. This needs `@react-native-firebase/app-check` (the JS SDK has no native providers) and a paid Apple developer account for App Attest. Enforcing it locks out old app versions.

## Tooling

2. The iOS version in `Info.plist` is still 0.4.18 while `package.json` is 0.4.22. Bump it with each release.

3. `npx expo run:ios` fails with "Can't determine id of Simulator app", even though Xcode is selected. Builds work through `xcodebuild` directly.

## Assets

4. Icons are exported at 1× (100×100 px) but shown at up to ~3× density, so they're slightly soft on iPhones. Consider exporting `@2x`/`@3x` variants.

## UI

5. Tutorial hint card: its buttons don't line up with the faded Back/Help/Menu bar underneath, and the movement diagram's bottom arrow sticks out past the card.

6. The editor shows "Level title is required!" before anything has been typed. Show it only after the field has been touched.

7. Hide the coin counter on levels with no coins (it shows "0/0").

8. The win screen has no Menu button, only Back and Next Level.

9. The in-game menu has no backdrop, and tapping outside it doesn't close it.

10. Home menu:
    - The page dots are tiny and white.
    - About 40% of the screen is empty.
    - Nothing hints that you can swipe.
    - There's no progress or coin balance.

11. Header logo: low-contrast text over busy art, and it uses about 120pt on every page. The top-left icon on Levels is unclear.

12. Menu and tool-picker buttons have the icon on the left and the text pushed far right. Center the content, or place the label next to the icon.

13. The grey card header bars (Profile, Create Level, Manage) clash with the pastel theme and look disabled.

14. The EDIT BOARD dark-grey wash makes the preview look disabled. Try a lighter wash or a small "✎ Edit board" pill.

15. Game screen:
    - The move count and best are tiny grey corner text.
    - The `/5` coin counter is a faint subscript.
    - There's dead space above the board.

16. Editor walls render as isolated squares instead of joined walls as in play.

17. Tool picker:
    - Metal Crate and Diamond are filed under "Bomb Tiles".
    - The current tool isn't highlighted.
    - Save, Discard and Playtest are buried in the menu.

18. Sub-page tab bars: only the active tab is labelled, and the share and settings icons are ambiguous. Label every tab or none.

19. Profile shows the raw UID, and "Resend Email" still appears after "Email verified".

## Features

20. Add undo and an eraser to the editor.

21. Show overall progress on the Levels page (e.g. "5/30 complete").

22. Trim the Guide's wall of text and lean on in-context tutorial hints instead.
