# Gym Tracker — Phase 6 Handoff

## Added
- Full local JSON backup export for exercises, plans, plan exercises, sessions, sets, progression settings, recommendation log, and app settings.
- JSON backup restore through the system file picker. The format is validated before data is replaced; a newer schema version is rejected.
- CSV export of workout sessions and set history for spreadsheet use.
- Settings screen actions, busy states, error alerts, restore confirmation, and updated privacy guidance.

## Dependencies
Added Expo SDK 54-compatible package ranges for `expo-document-picker`, `expo-file-system`, and `expo-sharing`. Run `npm.cmd install`, then `npx.cmd expo install --fix` if needed.

## Run
```powershell
npm.cmd install
npx.cmd expo install --fix
npx.cmd expo start
```

## Test checklist
1. Open Settings and confirm database status appears.
2. Export a JSON backup and save it somewhere accessible.
3. Export CSV and open it in a spreadsheet app.
4. Create a throwaway workout or plan, restore the earlier backup, and confirm the throwaway data is gone while original data returns.
5. Cancel the file picker and confirm no data changes.
6. Test both export flows on the actual device. Sharing/file picker behaviour varies by platform.

## Important notes
- Restore is destructive: it replaces current local data. The app asks for confirmation and the UI recommends exporting first.
- Backups contain personal workout history and notes; keep them private.
- This is a local-only app. Sharing a backup file does not create cloud sync.
- The source package has not been run on the user's phone as part of this handoff. Validate the checklist before relying on backups.
