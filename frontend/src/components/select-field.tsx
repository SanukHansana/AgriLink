import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { BrandColors } from '@/constants/theme';

export function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly { label: string; value: T }[]; onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return <View style={{ gap: 7 }}>
    <Text style={{ fontWeight: '700', color: '#525552' }}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`Choose ${label}`} onPress={() => setOpen(true)} style={{ minHeight: 52, justifyContent: 'center', backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: '#9DAF98', borderRadius: 12 }}>
      <Text style={{ color: BrandColors.primary }}>{options.find((item) => item.value === value)?.label ?? 'Select'} ▾</Text>
    </Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 440, maxHeight: '80%', padding: 20, borderRadius: 16, backgroundColor: '#fff', gap: 12 }}>
          <Text accessibilityRole="header" style={{ fontWeight: '700', fontSize: 18 }}>{label}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">{options.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityState={{ selected: item.value === value }} onPress={() => { onChange(item.value); setOpen(false); }} style={{ padding: 14, backgroundColor: item.value === value ? BrandColors.primaryDark : '#fff', borderRadius: 8 }}><Text style={{ color: item.value === value ? '#fff' : BrandColors.primaryDark, fontSize: 16, fontWeight: item.value === value ? '800' : '500' }}>{item.label}</Text></Pressable>)}</ScrollView>
          <Button title="Close selection" onPress={() => setOpen(false)} />
        </View>
      </View>
    </Modal>
  </View>;
}
