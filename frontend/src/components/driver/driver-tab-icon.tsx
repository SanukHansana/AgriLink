import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/i18n/native';

const glyphs = {
  home: '⌂',
  jobs: '▣',
  active: '↝',
  history: '☷',
  profile: '○',
} as const;

export function DriverTabIcon({ color, name }: { color: ColorValue; name: keyof typeof glyphs }) {
  return <Text style={[styles.icon, { color }]}>{glyphs[name]}</Text>;
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 26,
  },
});
