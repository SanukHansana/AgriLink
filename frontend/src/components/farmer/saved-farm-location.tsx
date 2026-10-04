import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { LocationFields, type MapPin } from '@/components/location-fields';
import { api, getApiErrorMessage } from '@/services/api';
import type { FarmerProfile } from '@/types/farmer';

export function SavedFarmLocation({ profile, onSaved }: { profile: FarmerProfile; onSaved: () => void }) {
  const [pin, setPin] = useState<MapPin>({ latitude: profile.farmLocation.latitude, longitude: profile.farmLocation.longitude });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return <View style={{ padding: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, gap: 12 }}>
    <Text style={{ fontSize: 18, fontWeight: '700', color: '#006F2B' }}>Saved farm map location</Text>
    <Text style={{ fontSize: 16 }}>Choose the usual pickup spot for your farm. New products and pickup requests can reuse it.</Text>
    <LocationFields value={pin} onChange={setPin} />
    <Button title={busy ? 'Saving location…' : 'Save farm map location'} disabled={busy} onPress={async () => {
      setBusy(true); setError(null);
      try { await api.patch('/farmers/profile', { farmLocation: { ...profile.farmLocation, latitude: pin.latitude, longitude: pin.longitude } }); onSaved(); }
      catch (cause) { setError(getApiErrorMessage(cause)); }
      finally { setBusy(false); }
    }} />
    {error && <Text accessibilityRole="alert" style={{ color: '#B42318' }}>{error}</Text>}
  </View>;
}
