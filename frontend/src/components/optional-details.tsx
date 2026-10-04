import { useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { BrandColors } from '@/constants/theme';

export function OptionalDetails({ children, title = 'More details (optional)' }: PropsWithChildren<{ title?: string }>) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 16 }}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ minHeight: 52, padding: 14, borderRadius: 12, borderColor: BrandColors.border, borderWidth: 1, backgroundColor: BrandColors.primarySurface }}><Text style={{ fontSize: 16, color: BrandColors.primaryDark, fontWeight: '700' }}>{open ? '−' : '+'} {title}</Text></Pressable>
    {open && children}
  </View>;
}
