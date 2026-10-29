import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Surface } from '@/components/Surface';
import { checkDatabaseHealth, type DatabaseHealth } from '@/db/healthCheck';
import { exportBackup, exportWorkoutCsv, importBackup } from '@/db/dataPortability';
import { theme } from '@/constants/theme';

function ActionButton({ title, subtitle, onPress, disabled = false }: { title: string; subtitle: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, pressed && !disabled && styles.pressed, disabled && styles.disabled]}><View style={styles.actionText}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.body}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></Pressable>;
}

export default function SettingsScreen() {
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => { checkDatabaseHealth().then(setHealth).catch((e: unknown) => setError(e instanceof Error ? e.message : 'Database check failed.')); }, []);
  useEffect(refresh, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const runAction = async (action: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true);
    try { const result = await action(); if (result && typeof result === 'object' && 'cancelled' in result && result.cancelled) return; Alert.alert('Done', success); refresh(); }
    catch (e) { Alert.alert('Could not complete action', e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const confirmRestore = () => Alert.alert('Restore backup?', 'Restoring replaces the workout data currently on this phone with the selected backup. Export a backup first if you want to keep the current data.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Choose backup', style: 'destructive', onPress: () => { void runAction(async () => { const result = await importBackup(); if (!result.cancelled) refresh(); return result; }, 'Backup restored successfully.'); } }]);
  return <Screen><SectionTitle eyebrow="Your app, your rules" title="Settings" />
    <Surface><Text style={styles.title}>Privacy by default</Text><Text style={styles.body}>Your workout data stays in this phone's local SQLite database. There is no account, cloud sync, analytics or API connection.</Text></Surface>
    <Surface><Text style={styles.title}>Local database status</Text>{health ? <><Text style={styles.status}>Ready · schema version {health.schemaVersion}</Text><Text style={styles.body}>{health.exerciseCount} exercises currently stored.</Text></> : error ? <Text style={styles.error}>{error}</Text> : <View style={styles.inline}><ActivityIndicator color={theme.colors.accent} /><Text style={styles.body}>Checking local database…</Text></View>}</Surface>
    <Surface><Text style={styles.title}>Your data</Text><Text style={styles.body}>Export a full JSON backup to move your data to another phone or restore it later. CSV is for viewing workout history in spreadsheet apps.</Text>
      <View style={styles.actions}><ActionButton title="Export full backup" subtitle="Plans, exercises, sessions, sets and settings · JSON" disabled={busy} onPress={() => void runAction(exportBackup, 'Your backup is ready to save or share.')} /><ActionButton title="Restore from backup" subtitle="Replaces data on this phone · JSON" disabled={busy} onPress={confirmRestore} /><ActionButton title="Export workout history" subtitle="One row per logged set · CSV for Excel or Sheets" disabled={busy} onPress={() => void runAction(exportWorkoutCsv, 'Your workout history is ready to save or share.')} /></View>
      {busy ? <View style={styles.inline}><ActivityIndicator color={theme.colors.accent} /><Text style={styles.body}>Working…</Text></View> : null}
    </Surface>
    <Surface><Text style={styles.title}>Before sharing this app</Text><Text style={styles.body}>Backups may contain your full workout history and notes. Keep them private. Restoring replaces current data, so export first if you are unsure.</Text></Surface>
  </Screen>;
}
const styles = StyleSheet.create({ title: { color: theme.colors.text, fontSize: 17, fontWeight: '800', marginBottom: 7 }, body: { color: theme.colors.muted, fontSize: 14, lineHeight: 21 }, status: { color: theme.colors.success, fontSize: 13, fontWeight: '800', marginBottom: 4 }, error: { color: theme.colors.danger }, inline: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }, actions: { gap: 2, marginTop: 10 }, action: { minHeight: 64, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border, paddingVertical: 12, gap: 10 }, actionText: { flex: 1, gap: 3 }, actionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '700' }, arrow: { color: theme.colors.accent, fontSize: 27, paddingHorizontal: 4 }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.45 } });
