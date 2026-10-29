import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  plans: 'barbell-outline',
  calendar: 'calendar-outline',
  progress: 'stats-chart-outline',
  settings: 'settings-outline',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        // Let the tab bar account for Android's gesture/navigation inset.
        // Keeping the content area consistent prevents icons and labels from
        // being squeezed together or clipped at the bottom of the screen.
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 1,
          marginBottom: 0,
          includeFontPadding: false,
        },
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={icons[route.name] ?? 'ellipse-outline'}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="plans" options={{ title: 'Plans' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
