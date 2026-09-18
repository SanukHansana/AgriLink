import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Button, Linking, Text, View } from 'react-native';
import { api, getApiErrorMessage } from '@/services/api';
import { mapUrl } from '@/components/location-fields';
import type { DeliveryJob } from '@/types/logistics';

export function DriverLocation({ orderId }: { orderId: string }) {
  const [job, setJob] = useState<DeliveryJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    const load = () => api.get<{ job: DeliveryJob | null }>(`/buyers/orders/${orderId}/delivery`).then(({ data }) => { if (active) { setJob(data.job); setError(null); } }).catch((cause) => { if (active) setError(getApiErrorMessage(cause)); });
    void load(); const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [orderId]));
  return <View style={{ margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#edf5ef', gap: 10 }}>
    <Text style={{ fontWeight: '700' }}>Driver location</Text>
    {error ? <Text>{error}</Text> : !job ? <Text>Pickup has not been scheduled yet.</Text> : <><Text>{job.jobCode} · {job.status}</Text>{job.driverLocation ? <><Text>Updated {new Date(job.driverLocation.recordedAt).toLocaleTimeString()}</Text><Button title="View current driver location on map" onPress={() => void Linking.openURL(mapUrl(job.driverLocation!))} /></> : <Text>The driver is not currently sharing a recent location.</Text>}</>}
  </View>;
}
