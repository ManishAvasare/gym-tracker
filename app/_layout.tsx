import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '@/db/database';
import { theme } from '@/constants/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase().then(() => setReady(true)).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not initialise local database.');
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {error ? (
        <View style={styles.center}><Text style={styles.errorTitle}>Database setup failed</Text><Text style={styles.error}>{error}</Text></View>
      ) : !ready ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.accent} size="large" /><Text style={styles.loading}>Preparing your local gym log…</Text></View>
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: theme.colors.background },
  loading: { color: theme.colors.muted, fontSize: 14 },
  errorTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  error: { color: theme.colors.danger, textAlign: 'center' },
});
