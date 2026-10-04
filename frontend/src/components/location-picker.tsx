import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { Text } from '@/i18n/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapCanvas } from '@/components/map-canvas';
import { Button } from '@/components/button';
import { validPin, type SelectedPin } from '@/services/map-picker';

export function LocationPicker({ value, onSelect, onClose }: { value: { latitude?: number; longitude?: number }; onSelect: (pin: SelectedPin) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<SelectedPin | null>(() => validPin(value) ? value : null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { if (!ready) setError(true); }, 20000);
    return () => clearTimeout(timer);
  }, [ready]);
  return <Modal visible animationType="slide" onRequestClose={onClose}><SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
    <View style={{ padding: 20, gap: 8 }}><Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '700', color: '#006f2b' }}>Choose a location</Text><Text style={{ fontSize: 16 }}>Move and zoom the map, then tap the exact pickup or delivery spot. You can drag the pin.</Text></View>
    <View style={{ flex: 1, minHeight: 250 }}><MapCanvas pin={value} onSelect={setSelected} onReady={() => { setReady(true); setError(false); }} onError={() => { setError(true); setReady(false); }} /></View>
    <View style={{ padding: 20, gap: 12 }}>
      {error ? <Text accessibilityRole="alert" style={{ color: '#B42318' }}>Map unavailable. Check your connection, or cancel and try again later.</Text> : <Text style={{ fontSize: 16 }}>{selected ? 'Location selected. Confirm below, or tap another spot.' : 'Tap the map to place your pin.'}</Text>}
      <Button title="Use selected location" disabled={!selected || !ready || error} onPress={() => { if (selected) { onSelect(selected); onClose(); } }} />
      <Button title="Cancel map selection" onPress={onClose} />
    </View>
  </SafeAreaView></Modal>;
}
