# Phase 2 — App Foundation Handoff

**Status:** Source scaffold created; local execution still needs verification on the developer's machine/device.

## Decisions implemented
- React Native + Expo + TypeScript
- Expo Router with five bottom tabs: Today, Plans, Calendar, Progress, Settings
- Dark theme tokens and reusable UI components
- Local database named `gym-tracker.db` using `expo-sqlite`
- SQLite foreign keys enabled and WAL journal mode selected
- Versioned schema initialised with `PRAGMA user_version`
- Tables for exercises, workout plans, plan exercises, workout sessions, workout sets, progression settings, recommendation log, and app settings
- Settings screen exposes a basic database health check
- No account, cloud backend, analytics, or required internet connection in the app foundation

## Project layout

```text
gym-tracker/
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── plans.tsx
│       ├── calendar.tsx
│       ├── progress.tsx
│       └── settings.tsx
├── src/
│   ├── components/
│   ├── constants/theme.ts
│   └── db/
│       ├── database.ts
│       ├── healthCheck.ts
│       └── schema.ts
├── app.json
├── package.json
├── tsconfig.json
├── README.md
└── PHASE-2-IMPLEMENTATION.md
```

## Database tables
- `exercises`: stable exercise IDs, names, muscle group/equipment/notes, archive timestamps
- `workout_plans`: saved plan metadata
- `plan_exercises`: ordered exercise templates and target set/rep/rest values
- `workout_sessions`: planned or blank session history, status and deload marker
- `workout_sets`: actual per-set weight, reps, warm-up/working type and optional effort data
- `progression_settings`: configurable global or exercise-specific progression rules
- `recommendation_log`: suggestions, reasons and user decisions
- `app_settings`: local preferences such as weight unit and theme

## How to run
1. Install Node.js LTS.
2. Extract `gym-tracker-phase2.zip`.
3. Open the extracted `gym-tracker-phase2` folder in VS Code.
4. Run `npm install`.
5. Run `npx expo start`.
6. Scan the QR code with Expo Go or launch an Android emulator.

If the SDK packages need alignment, run `npx expo install --fix`, inspect the package changes, then run the app again.

## Verification still required
This scaffold has been generated but has not been installed/launched in a real Expo runtime in this session. Verify package compatibility and startup locally. The schema and screens are a starting foundation, not a completed workout tracker.

## Phase 3 scope
1. Exercise library CRUD, including custom exercises.
2. Create, edit, duplicate and archive workout plans.
3. Add/reorder exercises in plans.
4. Start planned and blank sessions.
5. Enter set-by-set weight and reps.
6. Show previous session performance for each exercise.
7. Autosave and resume an in-progress session.
