import { DateTimeField } from '@/components/date-time-field';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';

type Visit = { _id: string; requestId: string; title: string; farmer: { name: string }; farmLocation: { district: string; address?: string }; status: string; scheduledAt: string; findings?: string; followUpNotes?: string };
export default function FieldVisits() {
  const router = useRouter(); const [visits, setVisits] = useState<Visit[]>([]); const [revision, setRevision] = useState(0); const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => { let active = true; api.get('/advisory/visits', { params: { revision } }).then(({ data }) => { if (active) { setVisits(data.visits); setError(null); } }).catch((cause) => { if (active) setError(getApiErrorMessage(cause)); }); return () => { active = false; }; }, [revision]));
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}><Button title="Back" onPress={() => router.replace('/(app)/officer')} /><Text style={{ fontSize: 26, fontWeight: '700' }}>Field visit schedule</Text>{error && <Text>{error}</Text>}{!visits.length && <Text>Schedule a visit when responding to a farmer request.</Text>}{visits.map((visit) => <VisitCard key={visit._id} visit={visit} onChange={() => setRevision((value) => value + 1)} />)}</ScrollView>;
}

function VisitCard({ visit, onChange }: { visit: Visit; onChange: () => void }) {
  const [date, setDate] = useState(''); const [findings, setFindings] = useState(''); const [followUp, setFollowUp] = useState(''); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const update = async (action: string) => { setBusy(true); setError(null); try { await api.patch(`/advisory/requests/${visit.requestId}/visits/${visit._id}`, { action, scheduledAt: date, findings, followUpAt: followUp || undefined, followUpNotes: notes }); onChange(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } };
  return <View style={{ backgroundColor: '#fff', padding: 18, borderRadius: 12, gap: 12 }}><Text style={{ fontWeight: '700' }}>{visit.title} · {visit.farmer.name}</Text><Text>{new Date(visit.scheduledAt).toLocaleString()} · {visit.status}</Text><Text>{visit.farmLocation.address}, {visit.farmLocation.district}</Text>{visit.findings && <Text localize={false}>{visit.findings}</Text>}{visit.status === 'scheduled' && <><DateTimeField mode="datetime" label="Reschedule to" value={date} onChangeText={setDate} placeholder="2026-10-20T09:30:00+05:30" /><Button title="Reschedule visit" disabled={busy} onPress={() => void update('reschedule')} /><Button title="Cancel visit" disabled={busy} onPress={() => void update('cancel')} /><FormField label="Visit findings" value={findings} onChangeText={setFindings} multiline maxLength={2000} /><DateTimeField mode="datetime" label="Optional follow-up time" value={followUp} onChangeText={setFollowUp} /><FormField label="Follow-up instructions" value={notes} onChangeText={setNotes} multiline maxLength={1000} /><Button title="Complete visit & save findings" disabled={busy} onPress={() => void update('complete')} /></>}{error && <Text style={{ color: '#a33425' }}>{error}</Text>}</View>;
}
