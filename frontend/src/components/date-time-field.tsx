import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View, type TextInputProps } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { FormField } from '@/components/auth/form-field';
import { Button } from '@/components/button';
import { SelectField } from '@/components/select-field';
import { BrandColors } from '@/constants/theme';

const pad = (number: number) => String(number).padStart(2, '0');
const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const months = Array.from({ length: 12 }, (_, index) => ({ value: String(index), label: new Date(2026, index, 1).toLocaleString('en', { month: 'long' }) }));
const hours = Array.from({ length: 24 }, (_, index) => ({ value: String(index), label: pad(index) }));
const minutes = Array.from({ length: 60 }, (_, index) => ({ value: String(index), label: pad(index) }));

function parseSelection(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsed = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 9) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function DateTimeField({ label, value = '', onChangeText, mode = 'date', allowPastDates = false, ...props }: TextInputProps & { label: string; mode?: 'date' | 'datetime'; allowPastDates?: boolean }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(() => parseSelection(value));
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = month.getFullYear();
  const years = Array.from({ length: 201 }, (_, index) => ({ value: String(year - 100 + index), label: String(year - 100 + index) }));
  const days = new Date(year, month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const updateTime = (hour: number, minute: number) => {
    const next = new Date(selected); next.setHours(hour, minute, 0, 0); setSelected(next);
  };
  const choose = () => {
    const parsed = parseSelection(value);
    const initial = !allowPastDates && parsed < today ? new Date() : parsed;
    setSelected(initial); setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1)); setOpen(true);
  };
  return <View style={{ gap: 8 }}>
    <FormField {...props} label={label} value={value} onChangeText={onChangeText} placeholder={props.placeholder ?? (mode === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DDTHH:mm:ss+05:30')} />
    <Button title={`Choose ${label}`} onPress={choose} disabled={props.editable === false} />
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.dialog}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
          <Text accessibilityRole="header" style={styles.heading}>{label}</Text>
          <View style={styles.row}><View style={{ flex: 1 }}><SelectField label="Month" value={String(month.getMonth())} options={months} onChange={(value) => setMonth(new Date(year, Number(value), 1))} /></View><View style={{ flex: 1 }}><SelectField label="Year" value={String(year)} options={years} onChange={(value) => setMonth(new Date(Number(value), month.getMonth(), 1))} /></View></View>
          <View style={styles.row}><Button title="Previous month" onPress={() => setMonth(new Date(year, month.getMonth() - 1, 1))} /><Button title="Next month" onPress={() => setMonth(new Date(year, month.getMonth() + 1, 1))} /></View>
          <View style={styles.grid}>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
            {Array.from({ length: offset }, (_, index) => <View key={`blank-${index}`} style={styles.day} />)}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const date = new Date(year, month.getMonth(), day, selected.getHours(), selected.getMinutes());
              const active = localDate(selected) === localDate(date);
              const disabled = !allowPastDates && date < today;
              return <Pressable key={day} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Select ${localDate(date)}`} accessibilityState={{ selected: active, disabled }} onPress={() => setSelected(date)} style={[styles.day, active && !disabled && styles.selected, disabled && styles.disabledDay]}><Text style={{ color: disabled ? '#7B827B' : active ? '#fff' : BrandColors.primary }}>{day}</Text></Pressable>;
            })}
          </View>
          {mode === 'datetime' && <View style={styles.row}><View style={{ flex: 1 }}><SelectField label="Hour (24-hour)" value={String(selected.getHours())} options={hours} onChange={(value) => updateTime(Number(value), selected.getMinutes())} /></View><View style={{ flex: 1 }}><SelectField label="Minute" value={String(selected.getMinutes())} options={minutes} onChange={(value) => updateTime(selected.getHours(), Number(value))} /></View></View>}
          <Text>Selected: {mode === 'date' ? localDate(selected) : selected.toLocaleString()} {mode === 'datetime' ? '(local time)' : ''}</Text>
          {!allowPastDates && <Text>Choose today or a future date.</Text>}
          <Button title="Use selected date" disabled={!allowPastDates && selected < today} onPress={() => { if (!allowPastDates && selected < today) return; onChangeText?.(mode === 'date' ? localDate(selected) : selected.toISOString()); setOpen(false); }} />
          <Button title="Cancel date selection" onPress={() => setOpen(false)} />
        </ScrollView>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 460, maxHeight: '90%', borderRadius: 16, padding: 18, backgroundColor: '#fff' },
  heading: { fontWeight: '700', fontSize: 18, color: BrandColors.primary },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.2857%', textAlign: 'center', paddingVertical: 8, color: '#525552' },
  day: { width: '14.2857%', height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  selected: { backgroundColor: BrandColors.primary },
  disabledDay: { backgroundColor: '#F0F0F0', opacity: 0.6 },
});
