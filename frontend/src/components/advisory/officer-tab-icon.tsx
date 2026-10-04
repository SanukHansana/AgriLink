import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/i18n/native';

const glyphs = {
  dashboard: '⌂',
  requests: '▣',
  notices: '♧',
  reports: '▥',
  profile: '○',
} as const;

export function OfficerTabIcon({
  color,
  name,
}: {
  color: ColorValue;
  name: keyof typeof glyphs;
}) {
  return <Text style={[styles.icon, { color }]}>{glyphs[name]}</Text>;
}

const styles = StyleSheet.create({
  icon: { fontSize: 23, fontWeight: '800', lineHeight: 26 },
});
