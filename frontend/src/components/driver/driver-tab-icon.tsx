import type { ColorValue } from 'react-native';
import { StyleSheet, Text } from 'react-native';

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
