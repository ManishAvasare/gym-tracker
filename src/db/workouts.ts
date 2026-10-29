import { getDatabase } from './database';

export type Exercise = { id: string; name: string; muscle_group: string | null; equipment: string | null };
export type PlanExercise = Exercise & { plan_exercise_id: string; position: number; target_sets: number; rep_min: number; rep_max: number; rest_seconds: number | null };
export type WorkoutPlan = { id: string; name: string; description: string | null; exercise_count: number };
export type WorkoutSet = { id: string; set_number: number; weight: number; reps: number; completed_at: string | null; set_type: 'working' | 'warm-up' };

export const defaultExercises = [
  ['Barbell Back Squat', 'Legs', 'Barbell'], ['Leg Press', 'Legs', 'Machine'], ['Romanian Deadlift', 'Hamstrings', 'Barbell'],
  ['Leg Extension', 'Quadriceps', 'Machine'], ['Seated Leg Curl', 'Hamstrings', 'Machine'], ['Standing Calf Raise', 'Calves', 'Machine'],
  ['Bench Press', 'Chest', 'Barbell'], ['Incline Dumbbell Press', 'Chest', 'Dumbbells'], ['Chest Fly', 'Chest', 'Machine'],
  ['Lat Pulldown', 'Back', 'Cable'], ['Seated Cable Row', 'Back', 'Cable'], ['Barbell Row', 'Back', 'Barbell'],
  ['Overhead Press', 'Shoulders', 'Barbell'], ['Lateral Raise', 'Shoulders', 'Dumbbells'], ['Biceps Curl', 'Biceps', 'Dumbbells'],
  ['Triceps Pushdown', 'Triceps', 'Cable'], ['Pull-up', 'Back', 'Bodyweight'], ['Push-up', 'Chest', 'Bodyweight'],
];
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();

export async function ensureExerciseLibrary() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM exercises WHERE archived_at IS NULL');
  if ((row?.count ?? 0) > 0) return;
  const timestamp = now();
  await db.withTransactionAsync(async () => {
    for (const [name, muscle, equipment] of defaultExercises) {
      await db.runAsync('INSERT OR IGNORE INTO exercises (id,name,muscle_group,equipment,created_at,updated_at) VALUES (?,?,?,?,?,?)', uid(), name, muscle, equipment, timestamp, timestamp);
    }
  });
}

export async function listExercises(): Promise<Exercise[]> {
  await ensureExerciseLibrary();
  const db = await getDatabase();
  return db.getAllAsync<Exercise>('SELECT id,name,muscle_group,equipment FROM exercises WHERE archived_at IS NULL ORDER BY name COLLATE NOCASE');
}

export async function createExercise(name: string, muscleGroup = 'Other', equipment = 'Other'): Promise<string> {
  const clean = name.trim();
  if (!clean) throw new Error('Enter an exercise name.');
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM exercises WHERE name = ? COLLATE NOCASE AND archived_at IS NULL', clean);
  if (existing) return existing.id;
  const id = uid();
  const timestamp = now();
  await db.runAsync('INSERT INTO exercises (id,name,muscle_group,equipment,created_at,updated_at) VALUES (?,?,?,?,?,?)', id, clean, muscleGroup, equipment, timestamp, timestamp);
  return id;
}

export async function listPlans(): Promise<WorkoutPlan[]> {
  const db = await getDatabase();
  return db.getAllAsync<WorkoutPlan>(`SELECT p.id,p.name,p.description,COUNT(pe.id) AS exercise_count
    FROM workout_plans p LEFT JOIN plan_exercises pe ON pe.plan_id=p.id
    WHERE p.archived_at IS NULL GROUP BY p.id ORDER BY p.updated_at DESC`);
}

export async function getPlanExercises(planId: string): Promise<PlanExercise[]> {
  const db = await getDatabase();
  return db.getAllAsync<PlanExercise>(`SELECT e.id,e.name,e.muscle_group,e.equipment,pe.id AS plan_exercise_id,
    pe.position,pe.target_sets,pe.rep_min,pe.rep_max,pe.rest_seconds
    FROM plan_exercises pe JOIN exercises e ON e.id=pe.exercise_id WHERE pe.plan_id=? ORDER BY pe.position`, planId);
}

export async function savePlan(name: string, exerciseIds: string[]): Promise<string> {
  const clean = name.trim();
  if (!clean) throw new Error('Give your workout plan a name.');
  if (!exerciseIds.length) throw new Error('Choose at least one exercise.');
  const db = await getDatabase();
  const id = uid(); const timestamp = now();
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO workout_plans (id,name,description,created_at,updated_at) VALUES (?,?,?,?,?)', id, clean, null, timestamp, timestamp);
    for (let i=0; i<exerciseIds.length; i++) {
      await db.runAsync('INSERT INTO plan_exercises (id,plan_id,exercise_id,position,target_sets,rep_min,rep_max,rest_seconds) VALUES (?,?,?,?,?,?,?,?)', uid(), id, exerciseIds[i], i, 3, 8, 12, 90);
    }
  });
  return id;
}

export async function createSession(name: string, planId: string | null, isDeload = false): Promise<string> {
  const db = await getDatabase(); const id = uid();
  await db.runAsync('INSERT INTO workout_sessions (id,plan_id,name,started_at,status,is_deload) VALUES (?,?,?,?,?,?)', id, planId, name.trim() || 'Workout', now(), 'in-progress', isDeload ? 1 : 0);
  return id;
}

export async function getActiveSession(): Promise<{id:string; plan_id:string|null; name:string; started_at:string; is_deload:number}|null> {
  const db = await getDatabase();
  return db.getFirstAsync('SELECT id,plan_id,name,started_at,is_deload FROM workout_sessions WHERE status=\'in-progress\' ORDER BY started_at DESC LIMIT 1');
}

export async function getLatestExerciseSets(exerciseId: string, excludeSessionId?: string): Promise<{weight:number; reps:number; set_number:number}[]> {
  const db = await getDatabase();
  const previous = await db.getFirstAsync<{id:string}>('SELECT id FROM workout_sessions WHERE status=\'completed\' AND id != COALESCE(?, \'\') AND id IN (SELECT session_id FROM workout_sets WHERE exercise_id=?) ORDER BY completed_at DESC LIMIT 1', excludeSessionId ?? '', exerciseId);
  if (!previous) return [];
  return db.getAllAsync('SELECT weight,reps,set_number FROM workout_sets WHERE session_id=? AND exercise_id=? AND completed_at IS NOT NULL ORDER BY set_number', previous.id, exerciseId);
}

export async function getSessionSets(sessionId: string): Promise<(WorkoutSet & { exercise_id:string })[]> {
  const db = await getDatabase();
  return db.getAllAsync('SELECT id,exercise_id,set_number,weight,reps,completed_at,set_type FROM workout_sets WHERE session_id=? ORDER BY exercise_id,set_number', sessionId);
}

export async function addSet(sessionId: string, exerciseId: string, setNumber: number, weight = 0, reps = 0, setType: 'working'|'warm-up' = 'working') {
  const db = await getDatabase(); const id = uid();
  await db.runAsync('INSERT INTO workout_sets (id,session_id,exercise_id,set_number,set_type,weight,reps) VALUES (?,?,?,?,?,?,?)', id, sessionId, exerciseId, setNumber, setType, weight, reps);
  return id;
}

export async function updateSet(setId: string, weight: number, reps: number, completed: boolean) {
  const db = await getDatabase();
  await db.runAsync('UPDATE workout_sets SET weight=?,reps=?,completed_at=? WHERE id=?', Math.max(0, weight), Math.max(0, Math.floor(reps)), completed ? now() : null, setId);
}

export async function setSessionDeload(sessionId: string, isDeload: boolean) {
  const db = await getDatabase();
  await db.runAsync("UPDATE workout_sessions SET is_deload=? WHERE id=? AND status='in-progress'", isDeload ? 1 : 0, sessionId);
}

export async function finishSession(sessionId: string) {
  const db = await getDatabase();
  await db.runAsync('UPDATE workout_sessions SET status=\'completed\',completed_at=? WHERE id=?', now(), sessionId);
}

export async function sessionSummary() {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ workouts:number; total_sets:number }>(`SELECT COUNT(*) AS workouts,
    (SELECT COUNT(*) FROM workout_sets ws JOIN workout_sessions s ON s.id=ws.session_id WHERE s.status='completed') AS total_sets
    FROM workout_sessions WHERE status='completed'`);
  return { workouts: result?.workouts ?? 0, totalSets: result?.total_sets ?? 0 };
}
