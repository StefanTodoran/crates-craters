# Suggestions

Open items from `APP_REVIEW.md`, plus a few found since. Finished items are removed: the 15 quick-win fixes, the lock icon work, all earlier bug items, the security review fixes, the performance and code quality items, editor undo, and the account, Create Level and Manage Level redesigns, and the editor revamp (tool strip, toolbar with redo, eraser, bomb fuse editing), and the shared level cards (clean card layout, difficulty pills, instant likes, filter summary, Yours filter). Items are grouped by type and numbered continuously. Each one is standalone, so edit or delete freely.

## Security

1. [Deferred] App Check isn't enabled. The Firebase API key is in a public repo (normal for Firebase), so the rules are the only defense, and any script can call Firestore directly. Enable App Check (App Attest on iOS, Play Integrity on Android) and enforce it for Firestore. Also restrict the API key to your bundle and package IDs in the Cloud console. This needs `@react-native-firebase/app-check` (the JS SDK has no native providers) and a paid Apple developer account for App Attest. Enforcing it locks out old app versions.

## Code Quality

2. Stylesheets built at module scope still use the window width at launch, because `normalize()` runs when the file loads. Components now read the window size when they render, but full support for rotation and split screen means moving those stylesheets into hooks or memoized style functions.

3. Fetched shared levels are cast to `SharedLevel` (`UserLevels.tsx`), but the documents have no `created`, `downloads` or `official` fields, and `shared` is a Firestore Timestamp instead of a date string. Add a proper document-to-level conversion so the type matches.

## Tooling

4. The version is out of sync: `Info.plist` says 0.4.18, `app.json` 0.4.20 and `package.json` 0.4.22. Pick one source of truth and bump it with each release.

5. `npx expo run:ios` fails with "Can't determine id of Simulator app", even though Xcode is selected. Builds work through `xcodebuild` directly.

## Assets

6. Icons are exported at 1× (100×100 px) but shown at up to ~3× density, so they're slightly soft on iPhones. Now that the SVG sources are in `assets/svg`, the `@2x`/`@3x` PNGs can be rendered from them by a script.

## Shared Levels

7. Replace the length and solve rate sliders with preset chips. Today each one is an on/off button plus two sliders (minimum and maximum), so narrowing to "short levels" takes three controls and a lot of fiddling, and the numbers mean little until you know the level pool. Instead give each a single-select chip row in the filters sheet: Length: Any · Short · Medium · Long, and Difficulty: Any · Easy · Medium · Hard. Difficulty uses the same buckets and colors as the card difficulty pill, so the filter and the cards speak the same language, and "New" levels (too few attempts) are left out of any difficulty but Any. The length buckets should come from the real spread of best solutions (most shared levels are probably under 30 moves, so e.g. Short ≤ 12, Medium 13 to 30, Long 31+), not the current 50 and 100 cutoffs. One tap each, no "enable" step, and the active choices show up in the summary line under the search bar. If exact ranges are still wanted, a two-thumb range slider is the alternative, but UIKit has no native one, so it would be custom on both platforms.

## Features

B. Show overall progress on the Levels page (e.g. "5/30 complete").

C. Trim the Guide's wall of text and lean on in-context tutorial hints instead.

D. Use the real system search bar on the Shared levels page through a small native wrapper: `UISearchBar` on iOS and the Material search field on Android, exposed as one component (`value`, `onChangeText`, `placeholder`, `onSubmit`). React Native only offers the system search bar inside a native-stack navigation header, which the app doesn't use, and the existing packages are unmaintained and don't support the New Architecture. Needs a native rebuild.
