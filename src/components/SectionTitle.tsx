import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

export function SectionTitle({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 5 },
  eyebrow: { color: theme.colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: theme.colors.text, fontSize: 29, fontWeight: '800', letterSpacing: -0.8 },
});
