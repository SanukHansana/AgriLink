import { StyleSheet } from 'react-native';
import { Text } from '@/i18n/native';
import type { ColorValue } from 'react-native';

const glyphs = {
  home: '⌂',
  search: '⌕',
  cart: '▣',
  wanted: '+',
  orders: '☷',
  profile: '○',
} as const;

type BuyerTabIconProps = {
  color: ColorValue;
  name: keyof typeof glyphs;
};

export function BuyerTabIcon({ color, name }: BuyerTabIconProps) {
  return <Text style={[styles.icon, { color }]}>{glyphs[name]}</Text>;
}

const styles = StyleSheet.create({
  icon: { fontSize: 26, fontWeight: '700', lineHeight: 27 },
});
