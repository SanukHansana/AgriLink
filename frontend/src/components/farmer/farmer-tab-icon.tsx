import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { Text } from '@/i18n/native';

const glyphs = { home: '⌂', products: '▣', orders: '●', cooperative: '◉', profile: '○' } as const;

export function FarmerTabIcon({ color, name }: { color: ColorValue; name: keyof typeof glyphs }) {
  return <Text style={[styles.icon, { color }]}>{glyphs[name]}</Text>;
}

const styles = StyleSheet.create({ icon: { fontSize: 25, fontWeight: '700', lineHeight: 27 } });
