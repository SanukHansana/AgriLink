import * as Location from 'expo-location';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';

export type MapPin = { latitude?: number; longitude?: number };
export function mapUrl(point: MapPin & { addressLine?: string; city?: string; district?: string }) {
  const target = point.latitude !== undefined && point.longitude !== undefined ? `${point.latitude},${point.longitude}` : `${point.addressLine ?? ''}, ${point.city ?? ''}, ${point.district ?? ''}, Sri Lanka`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
}

export function LocationFields({ value, onChange }: { value: MapPin; onChange: (pin: MapPin) => void }) {
  const [latitudeText, setLatitudeText] = useState(value.latitude === undefined ? '' : String(value.latitude));
  const [longitudeText, setLongitudeText] = useState(value.longitude === undefined ? '' : String(value.longitude));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locate = async () => {
    setBusy(true); setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location permission was denied. You can enter coordinates manually.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitudeText(String(position.coords.latitude));
      setLongitudeText(String(position.coords.longitude));
      onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to get location'); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 10 }}>
    <Text style={{ color: '#64736b', fontSize: 12 }}>Optional map pin: enter both coordinates or use your current location while at this address.</Text>
    <FormField label="Latitude" keyboardType="numbers-and-punctuation" value={latitudeText} onChangeText={(text) => { setLatitudeText(text); onChange({ ...value, latitude: text.trim() ? Number(text) : undefined }); }} />
    <FormField label="Longitude" keyboardType="numbers-and-punctuation" value={longitudeText} onChangeText={(text) => { setLongitudeText(text); onChange({ ...value, longitude: text.trim() ? Number(text) : undefined }); }} />
    <Button title={busy ? 'Finding location…' : 'Use current location'} disabled={busy} onPress={locate} />
    {value.latitude !== undefined && value.longitude !== undefined && <Button title="Preview map pin" onPress={() => void Linking.openURL(mapUrl(value))} />}
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
