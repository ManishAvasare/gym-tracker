import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

type SurfaceProps = PropsWithChildren<{ style?: StyleProp<ViewStyle> }>;

export function Surface({ children, style }: SurfaceProps) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.lg, padding: theme.spacing.lg, gap: theme.spacing.sm },
});
