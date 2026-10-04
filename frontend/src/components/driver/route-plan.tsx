import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { api, getApiErrorMessage } from '@/services/api';
import type { DeliveryContactLocation } from '@/types/logistics';
import { googleMapsDirections } from '@/services/driver-directions';

type Route = { stops: (DeliveryContactLocation & { kind: string; index: number })[]; optimized: boolean; message: string; estimatedAirDistanceKm?: number };
export function RoutePlan({ jobId }: { jobId: string }) {
  const [route, setRoute] = useState<Route | null>(null); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [segment, setSegment] = useState<number | null>(null);
  const load = async (openMap: boolean) => {
    setBusy(true); setError(null); setSegment(null);
    try {
      const current = (await api.get<Route>(`/drivers/jobs/${jobId}/route`)).data;
      setRoute(current);
      if (openMap) { const directions = googleMapsDirections(current.stops); await Linking.openURL(directions.url); setSegment(directions.stopCount); }
    } catch (cause) { setError(cause instanceof Error && !('isAxiosError' in cause) ? cause.message : getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  return <View style={{ margin: 16, gap: 10 }}>
    <Button title={busy ? 'Preparing route…' : 'Open pickup & drop-off in Google Maps'} disabled={busy} onPress={() => void load(true)} />
    <Button title="Suggest remaining stop order" disabled={busy} onPress={() => void load(false)} />
    {route && <><Text>{route.message}</Text>{route.estimatedAirDistanceKm !== undefined && <Text>Straight-line total: {route.estimatedAirDistanceKm} km</Text>}{route.stops.map((point, i) => <Text key={`${point.kind}:${point.index}`}>{i + 1}. {point.kind}: {point.addressLine}, {point.city}</Text>)}{segment !== null && route.stops.length > segment && <Text>Opened the next {segment} stops. Confirm completed stops in AgriLink, then open Maps again for the rest.</Text>}</>}
    <Text>Google Maps may ask you to tap Start. Confirm pickups and deliveries in AgriLink.</Text>
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
