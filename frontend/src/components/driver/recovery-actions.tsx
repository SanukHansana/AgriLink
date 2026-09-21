import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { DeliveryJob } from '@/types/logistics';

export function RecoveryActions({ job, onChange }: { job: DeliveryJob; onChange: () => void }) {
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const action = async (action: string) => {
    setBusy(true); setError(null);
    try { await api.post(`/drivers/jobs/${job._id}/recovery`, { action, reason }); onChange(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <View style={{ margin: 16, padding: 16, backgroundColor: '#fff3df', borderRadius: 12, gap: 12 }}>
    <Text style={{ fontWeight: '700' }}>Delivery recovery</Text>
    {job.status === 'paused' ? <Text>Trip paused: {job.pauseReason}. An administrator must confirm custody and release it for reassignment. Keep the goods safe until handover is agreed.</Text> : <><FormField label="Reason for cancellation or reassignment" value={reason} onChangeText={setReason} maxLength={500} />{job.status === 'accepted' && <Button title="Cancel my acceptance before collection" disabled={busy} onPress={() => void action('release')} />}<Button title="Pause trip & request reassignment" disabled={busy} onPress={() => void action('pause')} /></>}
    {job.status === 'inTransit' && job.dropoffPoints?.some((point) => point.outcome === 'failed' || point.outcome === 'partial') && <Button title="Close trip after returning undelivered goods" disabled={busy} onPress={() => void action('finishExceptions')} />}
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
