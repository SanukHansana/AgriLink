import * as Location from 'expo-location';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { MapCanvas } from '@/components/map-canvas';
import { validPin } from '@/services/map-picker';
import { LocationPicker } from '@/components/location-picker';

export type MapPin = { latitude?: number; longitude?: number };
export function mapUrl(point: MapPin & { addressLine?: string; city?: string; district?: string }) {
  const target = point.latitude !== undefined && point.longitude !== undefined ? `${point.latitude},${point.longitude}` : `${point.addressLine ?? ''}, ${point.city ?? ''}, ${point.district ?? ''}, Sri Lanka`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target)}`;
}

export function LocationFields({ value, onChange }: { value: MapPin; onChange: (pin: MapPin) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const locate = async () => {
    setBusy(true); setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location permission was denied. Choose your location on the map instead.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to get location'); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 10 }}>
    <Text style={{ color: '#365840', fontSize: 16, fontWeight: '700' }}>{validPin(value) ? '✓ Location selected' : 'Choose your location (optional)'}</Text>
    {validPin(value) && <LocationPreview key={`${value.latitude}:${value.longitude}`} value={value} />}
    <Text style={{ color: '#526055', fontSize: 15 }}>Use your current position while at this address, or choose the spot on the map.</Text>
    <Button title={busy ? 'Finding location…' : 'Use current location'} disabled={busy} onPress={locate} />
    <Button title="Choose location on map" disabled={busy} onPress={() => setMapOpen(true)} />
    {mapOpen && <LocationPicker value={value} onClose={() => setMapOpen(false)} onSelect={(pin) => { onChange(pin); setError(null); }} />}
    {validPin(value) && <><Button title="Open location in Google Maps" onPress={() => void Linking.openURL(mapUrl(value))} /><Button title="Clear selected location" onPress={() => onChange({})} /></>}
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}

function LocationPreview({ value }: { value: MapPin }) {
  const [failed, setFailed] = useState(false);
  return <View accessibilityLabel="Selected location map preview" style={{ height: 170, borderRadius: 14, borderWidth: 1, borderColor: '#CBDCC4', overflow: 'hidden', backgroundColor: '#EAF2E2' }}>
    <MapCanvas pin={value} interactive={false} onSelect={() => {}} onReady={() => setFailed(false)} onError={() => setFailed(true)} />
    {failed && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 8 }}><Text style={{ color: '#526055', fontSize: 14 }}>Map preview unavailable. Your location is still selected.</Text></View>}
  </View>;
}
