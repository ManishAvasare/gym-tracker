# Gym Tracker — Phase 3 Handoff

## Implemented
- Create a named workout plan and select exercises from a seeded exercise library.
- Start a workout from a saved plan or start a blank workout.
- Log weight and reps per set, mark sets complete, and add additional sets/exercises.
- Autosave set edits to the on-device SQLite database.
- Show the most recent completed performance for an exercise when available.
- Resume an in-progress session from the Today screen.
- Finish a workout and count completed sessions/sets on Today.
- A manual deload toggle is present in the workout screen.

## Open and run
1. Extract this project folder.
2. In VS Code, open the extracted `gym-tracker-phase2` folder.
3. Run `npm.cmd install` (PowerShell) or `npm install` (Command Prompt).
4. Run `npx.cmd expo install --fix`.
5. Run `npx.cmd expo start`.

## Important current limitations
- The deload toggle is a session marker in the UI only; it does not yet automatically scale loads or apply progression rules.
- Plan defaults are 3 sets and 8–12 reps; editing per-exercise targets is planned for a later phase.
- Progression recommendations, workout calendar, and charts are not yet implemented.
- Data is local to the app installation. Uninstalling the app can remove its database; export/restore is planned later.
- The initial workout engine should be tested on a real device. In-progress session resumption is supported, but do not start a second workout while one is active.

## Phase 4
Implement deterministic progression recommendations (double progression, hold/reduce guidance, configurable increments), make deload behaviour explicit, and then add calendar/history views.
