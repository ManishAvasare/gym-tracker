import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline', plans: 'barbell-outline', calendar: 'calendar-outline', progress: 'stats-chart-outline', settings: 'settings-outline',
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: theme.colors.accent,
      tabBarInactiveTintColor: theme.colors.muted,
      tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, height: 64, paddingTop: 7, paddingBottom: 8 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="plans" options={{ title: 'Plans' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
