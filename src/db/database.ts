import * as SQLite from 'expo-sqlite';
import { INITIAL_SCHEMA, SCHEMA_VERSION } from './schema';

const DATABASE_NAME = 'gym-tracker.db';
let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Open and initialise the on-device database once per app process. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
      const currentVersion = result?.user_version ?? 0;

      if (currentVersion < 1) {
        await db.withTransactionAsync(async () => {
          for (const statement of INITIAL_SCHEMA) await db.execAsync(statement);
          await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
          const now = new Date().toISOString();
          await db.runAsync(
            'INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)',
            'weight_unit', 'kg', now,
          );
          await db.runAsync(
            'INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)',
            'theme', 'dark', now,
          );
        });
      }
      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
