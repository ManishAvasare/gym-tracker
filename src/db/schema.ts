/** Initial local SQLite schema. Migrations are versioned so future phases can safely evolve it. */
export const SCHEMA_VERSION = 1;

export const INITIAL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE,
    muscle_group TEXT,
    equipment TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_active_name
    ON exercises(name COLLATE NOCASE) WHERE archived_at IS NULL;`,
  `CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS plan_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    plan_id TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    position INTEGER NOT NULL,
    target_sets INTEGER NOT NULL DEFAULT 3 CHECK(target_sets > 0),
    rep_min INTEGER NOT NULL DEFAULT 8 CHECK(rep_min > 0),
    rep_max INTEGER NOT NULL DEFAULT 12 CHECK(rep_max >= rep_min),
    rest_seconds INTEGER CHECK(rest_seconds IS NULL OR rest_seconds >= 0),
    notes TEXT,
    UNIQUE(plan_id, position)
  );`,
  `CREATE TABLE IF NOT EXISTS workout_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    plan_id TEXT REFERENCES workout_plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'in-progress'
      CHECK(status IN ('in-progress', 'completed', 'cancelled')),
    notes TEXT,
    is_deload INTEGER NOT NULL DEFAULT 0 CHECK(is_deload IN (0, 1))
  );`,
  `CREATE TABLE IF NOT EXISTS workout_sets (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    set_number INTEGER NOT NULL CHECK(set_number > 0),
    set_type TEXT NOT NULL DEFAULT 'working' CHECK(set_type IN ('working', 'warm-up')),
    weight REAL NOT NULL DEFAULT 0 CHECK(weight >= 0),
    reps INTEGER NOT NULL DEFAULT 0 CHECK(reps >= 0),
    rir REAL,
    rpe REAL,
    completed_at TEXT,
    notes TEXT
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON workout_sessions(started_at);`,
  `CREATE INDEX IF NOT EXISTS idx_sets_session_exercise ON workout_sets(session_id, exercise_id);`,
  `CREATE TABLE IF NOT EXISTS progression_settings (
    id TEXT PRIMARY KEY NOT NULL,
    exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
    method TEXT NOT NULL DEFAULT 'double',
    rep_min INTEGER NOT NULL DEFAULT 8,
    rep_max INTEGER NOT NULL DEFAULT 12,
    load_increment REAL NOT NULL DEFAULT 2.5,
    success_rule TEXT NOT NULL DEFAULT 'all_sets_hit_rep_max',
    failure_rule TEXT NOT NULL DEFAULT 'maintain_then_reduce',
    deload_rule TEXT NOT NULL DEFAULT 'manual',
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS recommendation_log (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT REFERENCES workout_sessions(id) ON DELETE SET NULL,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    created_at TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    suggested_weight REAL,
    reason TEXT NOT NULL,
    user_decision TEXT
  );`,
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
] as const;
