import { getDatabase } from './database';

export type DatabaseHealth = { ready: true; schemaVersion: number; exerciseCount: number };

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const db = await getDatabase();
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM exercises;');
  return {
    ready: true,
    schemaVersion: version?.user_version ?? 0,
    exerciseCount: count?.count ?? 0,
  };
}
