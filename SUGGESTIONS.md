# Suggestions

Open items from `APP_REVIEW.md`, plus a few found since. Finished items are removed: the 15 quick-win fixes, the lock icon work, all earlier bug items, the security review fixes, the performance and code quality items, editor undo, and the account, Create Level and Manage Level redesigns. Items are grouped by type and numbered continuously. Each one is standalone, so edit or delete freely.

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

## Editor

Ideas for an editor revamp, most impactful first. 1 and 2 together are the real revamp; the rest stand alone.

7. Replace the Change Tool screen with a tool strip: a scrollable row of tool icons under the board, with the current tool highlighted, so switching is one tap. Bomb fuse and one-way rotation appear inline only when those tools are picked.

8. Add a compact top toolbar: small icon buttons above the board for Undo, Redo, Playtest and Save, with a dot on Save when there are unsaved changes. This frees the bottom for the tool strip and adds redo.

9. Check the level before Playtest or Share: small warnings for no spawn, no flag, coins the player can't reach, or keys without doors.

10. Long-press a placed tile to edit it, such as a bomb's fuse or a one-way tile's direction, instead of setting these before placing.

11. Later: rectangle fill, clear board and mirror mode.

## Features

A. Add an eraser tool to the editor (undo is done).

B. Show overall progress on the Levels page (e.g. "5/30 complete").

C. Trim the Guide's wall of text and lean on in-context tutorial hints instead.

D. Use the real system search bar on the Shared levels page through a small native wrapper: `UISearchBar` on iOS and the Material search field on Android, exposed as one component (`value`, `onChangeText`, `placeholder`, `onSubmit`). React Native only offers the system search bar inside a native-stack navigation header, which the app doesn't use, and the existing packages are unmaintained and don't support the New Architecture. Needs a native rebuild.
