import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { api, getApiErrorMessage } from '@/services/api';
import type { AssistanceRequest } from '@/types/advisory';

export default function FarmerAssistance() {
  const router = useRouter(); const [requests, setRequests] = useState<AssistanceRequest[]>([]); const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { let active = true; api.get('/advisory/requests').then(({ data }) => { if (active) { setRequests(data.requests); setError(null); } }).catch((cause) => { if (active) setError(getApiErrorMessage(cause)); }); return () => { active = false; }; }, []));
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}><Text style={{ fontSize: 26, fontWeight: '700', color: '#183d2c' }}>Agriculture assistance</Text><Button title="Back to farm" onPress={() => router.replace('/(app)/farmer')} /><Button title="New assistance request" onPress={() => router.push('/(app)/farmer/assistance/new')} />{error && <Text>{error}</Text>}{!requests.length && <Text>Your assistance requests and officer replies will appear here.</Text>}{requests.map((item) => <Pressable key={item._id} onPress={() => router.push({ pathname: '/(app)/farmer/assistance/[requestId]', params: { requestId: item._id } })} style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12 }}><Text style={{ fontWeight: '700' }} localize={false}>{item.title}</Text><Text>{item.status} · {item.responses.length} replies</Text><Text>{item.assignedOfficer?.name ?? 'Awaiting officer assignment'}</Text></Pressable>)}</ScrollView>;
}
