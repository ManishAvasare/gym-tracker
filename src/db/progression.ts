import type { WorkoutSet } from '@/db/workouts';

export type ProgressionAction = 'increase' | 'maintain' | 'reduce' | 'deload' | 'first-session';
export type ProgressionRecommendation = {
  action: ProgressionAction;
  suggestedWeight: number | null;
  message: string;
  reason: string;
};

/**
 * Conservative double-progression rules for working sets.
 * Defaults: 8–12 reps, +2.5 kg. Recommendations never change logged sets automatically.
 */
export function recommendProgression(
  previousSets: Array<{ weight: number; reps: number }>,
  options: { repMin?: number; repMax?: number; increment?: number; deload?: boolean } = {},
): ProgressionRecommendation {
  const repMin = options.repMin ?? 8;
  const repMax = options.repMax ?? 12;
  const increment = options.increment ?? 2.5;
  const valid = previousSets.filter(s => Number.isFinite(s.weight) && Number.isFinite(s.reps) && s.weight >= 0 && s.reps > 0);
  if (!valid.length) {
    return { action: 'first-session', suggestedWeight: null, message: 'Log your first working sets', reason: 'There is no completed workout history for this exercise yet.' };
  }
  const workingWeight = Math.max(...valid.map(s => s.weight));
  if (options.deload) {
    const reduced = Math.max(0, roundLoad(workingWeight * 0.9));
    return { action: 'deload', suggestedWeight: reduced, message: `Deload suggestion: ${reduced} kg`, reason: 'A deload is selected. This uses about 10% less than your previous working weight; adjust for available equipment and how you feel.' };
  }
  const allHitTop = valid.every(s => s.reps >= repMax);
  if (allHitTop) {
    const next = roundLoad(workingWeight + increment);
    return { action: 'increase', suggestedWeight: next, message: `Try ${next} kg next time`, reason: `Every recorded set reached ${repMax} reps. Increase by ${increment} kg and build reps again.` };
  }
  const anyBelowMinimum = valid.some(s => s.reps < repMin);
  if (anyBelowMinimum) {
    return { action: 'maintain', suggestedWeight: workingWeight, message: `Keep around ${workingWeight} kg`, reason: `At least one set was below ${repMin} reps. Keep the load and build reps before increasing.` };
  }
  return { action: 'maintain', suggestedWeight: workingWeight, message: `Keep ${workingWeight} kg and build reps`, reason: `You are within the ${repMin}–${repMax} rep range. Increase the load after all working sets reach ${repMax} reps.` };
}

function roundLoad(value: number) {
  // Round to the nearest 0.5 kg to accommodate common plate increments.
  return Math.max(0, Math.round(value * 2) / 2);
}
