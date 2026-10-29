# Gym Tracker — Phase 5 Handoff

## Included
- Monthly calendar with month navigation, workout-day markers, selected-date session details, completed set counts, and working-set volume.
- Progress summary metrics: completed workouts, active days, completed sets, and total working volume.
- Eight-week volume chart and weekly completed-workout consistency bars.
- Exercise history selector with date, session, maximum logged working weight, and session volume.
- Personal-record list showing maximum logged working-set weight and best single-set volume.
- Uses existing local SQLite database; no account, server, or additional package required.

## Important definitions
- Training volume is logged `weight × reps` summed across completed working sets. It is a tracking metric, not a direct measure of muscle growth.
- The PR list reports the highest logged working-set load per exercise and best single-set volume. It does not estimate one-rep max.
- Calendar markers represent completed sessions only.
- History is based on recorded data. Uncompleted sets are excluded from the progress calculations.

## Files changed
- `app/(tabs)/calendar.tsx`
- `app/(tabs)/progress.tsx`

## Run
```powershell
npm.cmd install
npx.cmd expo install --fix
npx.cmd expo start
```

## Manual test checklist
1. Open Calendar with no workout history; verify empty state renders.
2. Complete a workout with at least one working set; return to Calendar and verify a marker appears on the completion date.
3. Tap the marked date and verify workout name, completed set count, and volume.
4. Open Progress and verify summary numbers agree with the completed workout.
5. Complete a second workout on a different date and verify weekly charts update.
6. Select an exercise in Exercise History and verify only that exercise's sessions appear.
7. Verify PR entries are based on completed working sets, not warm-up or incomplete sets.
8. Force-close and reopen the app; verify history remains available.

## Notes
This phase builds on the Phase 4 project and retains the existing SQLite schema. It has not been device-tested by the authoring environment; run the manual checks on your phone before relying on the metrics.
