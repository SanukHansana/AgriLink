import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { AppState, Button, Linking, Text, View } from 'react-native';
import { StopOutcome } from './stop-outcome';
import { mapUrl } from '@/components/location-fields';
import { api, getApiErrorMessage } from '@/services/api';
import type { DeliveryJob } from '@/types/logistics';

export function DeliveryStops({ job, onChange }: { job: DeliveryJob; onChange: () => void }) {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const focused = useRef(false);
  const generation = useRef(0);
  const stop = useCallback(() => {
    generation.current += 1;
    subscription.current?.remove(); subscription.current = null;
    setSharing(false);
    void api.patch(`/drivers/jobs/${job._id}/location`, { sharing: false }).catch(() => {});
  }, [job._id]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const appState = AppState.addEventListener('change', (state) => { if (state !== 'active') stop(); });
    return () => { focused.current = false; appState.remove(); stop(); };
  }, [stop]));
  const start = async () => {
    setBusy(true); setError(null);
    const version = ++generation.current;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') throw new Error('Location permission denied');
      let lastSent = 0;
      const watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 10 }, (position) => {
        if (generation.current !== version || !focused.current || AppState.currentState !== 'active' || Date.now() - lastSent < 10000) return;
        lastSent = Date.now();
        void api.patch(`/drivers/jobs/${job._id}/location`, { latitude: position.coords.latitude, longitude: position.coords.longitude }).catch((cause) => { setError(getApiErrorMessage(cause)); stop(); });
      });
      if (generation.current !== version || !focused.current) { watch.remove(); return; }
      subscription.current = watch; setSharing(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to share location'); }
    finally { setBusy(false); }
  };
  const kind = job.status === 'inTransit' ? 'dropoff' : 'pickup';
  const points = kind === 'pickup' ? job.pickupPoints : job.dropoffPoints?.length ? job.dropoffPoints : [{ ...job.destination, _id: 'legacy', completedAt: undefined }];
  const complete = async (index: number) => {
    setBusy(true); setError(null);
    try { await api.patch(`/drivers/jobs/${job._id}/stops`, { kind, index,  }); onChange(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <View style={{ padding: 16, gap: 12 }}>
    <Text style={{ fontWeight: '700', fontSize: 16 }}>{kind === 'pickup' ? 'Pickup stops' : 'Drop-off stops'}</Text>
    {points.map((point, index) => <View key={point._id} style={{ backgroundColor: '#edf5ef', padding: 14, borderRadius: 10, gap: 8 }}><Text>{index + 1}. {point.contactName} {point.completedAt ? '✓ Completed' : ''}</Text><Text>{point.addressLine}, {point.city}, {point.district}</Text><Button title="Navigate to this stop" onPress={() => void Linking.openURL(mapUrl(point))} />{point.phone && <Button title="Call contact" onPress={() => void Linking.openURL(`tel:${point.phone}`)} />}{!point.completedAt && kind === 'pickup' && job.status === 'collecting' && <><Text>{kind === 'pickup' ? 'Confirm once collection at this stop is complete.' : 'Confirm after handing over this buyer’s order.'}</Text><Button title={kind === 'pickup' ? 'Confirm collected' : 'Confirm dropped off'} disabled={busy} onPress={() => void complete(index)} /></>}{kind === 'dropoff' && point._id !== 'legacy' && <StopOutcome job={job} index={index} onChange={onChange} />}</View>)}
    <Text>Share your location with this delivery’s farmer and buyers while this screen is open. Sharing stops when you leave the screen or app.</Text>
    <Button title={sharing ? 'Stop sharing location' : 'Share live location'} disabled={busy} onPress={sharing ? stop : start} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
