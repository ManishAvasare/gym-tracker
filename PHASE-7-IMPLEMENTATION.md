# Phase 7 — Release preparation handoff

## Included
- Expo app and package versions aligned to `0.7.0`.
- `eas.json` with an internal Android APK preview profile and production AAB profile.
- `GITHUB-AND-ANDROID-RELEASE.md` with local checks, GitHub upload commands, EAS build, APK installation, and sharing instructions.

## Important status
This phase prepares the source for release; it does **not** include a compiled APK, a GitHub repository, or a verified cloud build. The developer must build with their own Expo account, then test the APK on actual devices.

## Suggested next actions
1. Run `npm.cmd install`, `npx.cmd expo install --fix`, and `npm.cmd run typecheck`.
2. Launch with `npx.cmd expo start` and smoke-test existing features.
3. Follow `GITHUB-AND-ANDROID-RELEASE.md` to push to GitHub and run an EAS APK build.
4. Test the APK on the primary phone and friend's phone before sharing.

## Data safety
Workout data is stored locally. Export a JSON backup before installing builds or changing versions. Do not commit workout exports to GitHub.
