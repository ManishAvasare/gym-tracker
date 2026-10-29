# Phase 4 — Progressive Overload & Deload Recommendations

This phase builds on the Phase 3 project. Keep a backup of your current folder before replacing files.

## Added
- `src/db/progression.ts`: deterministic, offline progression recommendation helper.
- Exercise cards show an explanation for maintaining or increasing the working load based on the last completed session.
- Default double-progression rules: 8–12 reps and +2.5 kg; increase only when every recorded working set reaches 12 reps.
- Deload toggle now saves the selected state to the active session. When selected, the suggestion is approximately 10% below the prior working weight.
- Previous-set lookup now ignores sets that were not marked complete.
- Recommendations never alter logged weights automatically; the lifter remains in control.

## Install/update
1. Back up the existing `gym-tracker-phase2` folder.
2. Extract this ZIP into a separate folder or copy its contents over the project after backing up.
3. From the project directory run `npm.cmd install`, then `npx.cmd expo install --fix`, then `npx.cmd expo start`.

## Current logic and limitations
- This is a simple, explainable default rule set, not a medical or coaching assessment.
- It assumes kg and a 2.5 kg default increment; dumbbell, machine, bodyweight and microloading exercises may need different increments.
- A single under-target session recommends maintaining the load; it does not automatically reduce weight.
- The deload suggestion uses about 10% less than the previous working load. It does not automatically reduce the number of sets.
- Per-exercise custom rep ranges and increments, RIR/RPE logic, repeated-failure detection, and recommendation history are planned improvements.
- Test on your device before relying on recommendations. No actual phone build was verified as part of this handoff.
