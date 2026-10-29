import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from './database';
import { SCHEMA_VERSION } from './schema';

const TABLES = ['exercises', 'workout_plans', 'plan_exercises', 'workout_sessions', 'workout_sets', 'progression_settings', 'recommendation_log', 'app_settings'] as const;
type TableName = typeof TABLES[number];
type Backup = { app: 'gym-tracker'; formatVersion: 1; schemaVersion: number; exportedAt: string; tables: Record<TableName, Record<string, unknown>[]> };
const timestamp = () => new Date().toISOString();

async function shareFile(filename: string, contents: string, mimeType: string) {
  if (!FileSystem.documentDirectory) throw new Error('Local document storage is unavailable on this device.');
  const uri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, contents, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType, dialogTitle: `Export ${filename}` });
  else throw new Error('Sharing is unavailable on this device. The export was saved inside the app, but cannot be shared from here.');
}

export async function exportBackup() {
  const db = await getDatabase();
  const tables = {} as Backup['tables'];
  for (const table of TABLES) tables[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  const backup: Backup = { app: 'gym-tracker', formatVersion: 1, schemaVersion: SCHEMA_VERSION, exportedAt: timestamp(), tables };
  await shareFile(`gym-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backup, null, 2), 'application/json');
}

function validateBackup(value: unknown): asserts value is Backup {
  if (!value || typeof value !== 'object') throw new Error('This file is not a valid Gym Tracker backup.');
  const backup = value as Partial<Backup>;
  if (backup.app !== 'gym-tracker' || backup.formatVersion !== 1 || !backup.tables || typeof backup.tables !== 'object') throw new Error('Unsupported backup format. Choose a Gym Tracker JSON backup.');
  for (const table of TABLES) if (!Array.isArray(backup.tables[table])) throw new Error(`Backup is missing the ${table} data.`);
  if (typeof backup.schemaVersion !== 'number' || backup.schemaVersion > SCHEMA_VERSION) throw new Error('This backup was created by a newer app version. Update the app before restoring it.');
}

export async function importBackup() {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/json', '*/*'], copyToCacheDirectory: true, multiple: false });
  if (picked.canceled || !picked.assets?.[0]) return { cancelled: true } as const;
  const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('The selected file is not valid JSON.'); }
  validateBackup(parsed);
  const db = await getDatabase();
  // Replace in dependency-safe order. Foreign keys are temporarily disabled for this transaction.
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.withTransactionAsync(async () => {
      for (const table of [...TABLES].reverse()) await db.runAsync(`DELETE FROM ${table}`);
      for (const table of TABLES) {
        for (const row of parsed.tables[table]) {
          const columns = Object.keys(row);
          if (!columns.length || columns.some((column) => !/^[a-z_]+$/.test(column))) throw new Error(`Invalid column data in ${table}.`);
          const placeholders = columns.map(() => '?').join(',');
          const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
          await db.runAsync(sql, ...columns.map((column) => row[column] as string | number | null));
        }
      }
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }
  return { cancelled: false } as const;
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
export async function exportWorkoutCsv() {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT s.name AS workout, s.started_at, s.completed_at, s.status, s.is_deload,
    e.name AS exercise, ws.set_number, ws.set_type, ws.weight, ws.reps, ws.rir, ws.rpe, ws.completed_at AS set_completed_at, ws.notes AS set_notes
    FROM workout_sessions s LEFT JOIN workout_sets ws ON ws.session_id=s.id LEFT JOIN exercises e ON e.id=ws.exercise_id
    ORDER BY s.started_at, ws.set_number`);
  const headers = ['workout','started_at','completed_at','status','is_deload','exercise','set_number','set_type','weight','reps','rir','rpe','set_completed_at','set_notes'];
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\r\n');
  await shareFile(`gym-tracker-history-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv');
  return rows.length;
}
