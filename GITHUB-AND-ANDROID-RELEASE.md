# GitHub and Android installation guide

## What this release setup does
- Prepares an Expo EAS preview profile that produces an installable Android APK.
- Keeps a production profile configured for an Android App Bundle (AAB), suitable for a future Play Store release.
- Uses version `0.7.0` as the release-preparation baseline.

This is configuration, not a built or tested APK. EAS needs your own Expo account and a successful cloud build.

## A. Run the project locally first
From this folder in VS Code:

```powershell
npm.cmd install
npx.cmd expo install --fix
npm.cmd run typecheck
npx.cmd expo start
```

Resolve any errors before creating a public release. Keep a backup of your working folder and export a JSON backup from the app before replacing any installed version.

## B. Put the source on GitHub
1. Create/sign in to GitHub and create a **private** repository named `gym-tracker` (recommended while testing).
2. Install Git for Windows if `git --version` is not recognised.
3. Open this project folder in VS Code.
4. In the terminal, run these commands, replacing the URL with your own repository URL:

```powershell
git init
git add .
git commit -m "Prepare Gym Tracker 0.7.0 release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gym-tracker.git
git push -u origin main
```

Do not commit personal workout exports, signing credentials, access tokens, or `.env` secrets. Review the staged files before pushing. The `.gitignore` should remain enabled.

## C. Build an Android APK with Expo EAS
1. Create/sign in to an Expo account at https://expo.dev/.
2. In the project terminal, install/login to EAS CLI:

```powershell
npm.cmd install --global eas-cli
eas login
eas build:configure
```

3. Inspect any changes made by `eas build:configure` and keep the `preview` profile in `eas.json`.
4. Build an installable APK:

```powershell
eas build --platform android --profile preview
```

5. Wait for the cloud build to finish successfully. Open the build URL that EAS prints and download the resulting `.apk`. Do not share a build until it succeeds and has been tested on a real phone.

## D. Install the APK on your Android phone
1. Send the APK to your phone using USB, Drive, or another trusted method.
2. Open the APK on the phone. Android may ask you to allow your file manager/browser to **Install unknown apps**; enable this only for the app you are using to install the APK, then turn it off again afterward if desired.
3. Confirm install, launch Gym Tracker, and test creating a workout, closing/reopening the app, viewing calendar/history, and exporting a backup.
4. Keep a JSON backup before installing future updates. An update must use the same Android package ID and a compatible signing identity to install over the existing app without uninstalling it. Never uninstall a version that contains your only copy of workout data.

## E. Share it with your friend
- Easiest: share the tested APK directly.
- GitHub option: create a GitHub Release and attach the APK under **Releases → Draft a new release**. Your friend downloads the APK from the release page and installs it.
- A public repository is not required to distribute the APK. Keep the source private if you prefer.
- This local-first app stores each person's data on their own device; it does not automatically sync between phones.

## F. Before publishing
- Test on your own phone and a second Android phone.
- Verify fresh install, app update, offline logging, app restart, backup restore, and CSV export.
- Verify the APK installs and opens after download from the release page.
- Do not call the app production-ready until these checks pass.
- For Google Play later, use the production AAB profile and complete Play Console's current testing, privacy, and store requirements.
