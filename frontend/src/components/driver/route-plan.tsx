import { useState } from 'react';
import { Button, Linking, Text, View } from 'react-native';
import { api, getApiErrorMessage } from '@/services/api';
import type { DeliveryContactLocation } from '@/types/logistics';

type Route = { stops: (DeliveryContactLocation & { kind: string; index: number })[]; optimized: boolean; message: string; estimatedAirDistanceKm?: number };
export function RoutePlan({ jobId }: { jobId: string }) {
  const [route, setRoute] = useState<Route | null>(null); const [error, setError] = useState<string | null>(null);
  const address = (point: DeliveryContactLocation) => point.latitude !== undefined && point.longitude !== undefined ? `${point.latitude},${point.longitude}` : `${point.addressLine}, ${point.city}, ${point.district}, Sri Lanka`;
  return <View style={{ margin: 16, gap: 10 }}><Button title="Suggest remaining stop order" onPress={async () => { try { setRoute((await api.get<Route>(`/drivers/jobs/${jobId}/route`)).data); setError(null); } catch (cause) { setError(getApiErrorMessage(cause)); } }} />{route && <><Text>{route.message}</Text>{route.estimatedAirDistanceKm !== undefined && <Text>Straight-line total: {route.estimatedAirDistanceKm} km</Text>}{route.stops.map((point, i) => <Text key={`${point.kind}:${point.index}`}>{i + 1}. {point.kind}: {point.addressLine}, {point.city}</Text>)}{route.stops.length > 0 && <Button title="Open next route segment in Google Maps for driving distance & ETA" onPress={() => { const points = route.stops.slice(0, 4); const last = points[points.length - 1]; const params = `destination=${encodeURIComponent(address(last))}&waypoints=${encodeURIComponent(points.slice(0, -1).map(address).join('|'))}`; void Linking.openURL(`https://www.google.com/maps/dir/?api=1&travelmode=driving&${params}`); }} />}</>}{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
