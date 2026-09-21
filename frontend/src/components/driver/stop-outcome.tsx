import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { FormField } from '@/components/auth/form-field';
import { ProofForm, type StopProof } from './proof-form';
import { getApiErrorMessage } from '@/services/api';
import { sendDriverUpdate } from '@/services/offline-driver';
import type { DeliveryJob } from '@/types/logistics';

export function StopOutcome({ job, index, onChange }: { job: DeliveryJob; index: number; onChange: () => void }) {
  const point = job.dropoffPoints?.[index];
  const [outcome, setOutcome] = useState<'delivered' | 'failed' | 'partial'>('delivered');
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState<StopProof>({ photoData: '', receiverName: '', receiverSignature: '' });
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  if (!point || job.status !== 'inTransit' || (point.completedAt && (point.outcome === 'delivered' || point.returnCompletedAt))) return null;
  const returning = Boolean(point.completedAt);
  const orders = job.orders.filter((order) => typeof order !== 'string' && point.orders.includes(order._id));
  const submit = async () => {
    setBusy(true); setError(null);
    try {
      if (returning) await sendDriverUpdate('post', `/drivers/jobs/${job._id}/recovery`, { action: 'return', index, proof });
      else await sendDriverUpdate('patch', `/drivers/jobs/${job._id}/stops`, { kind: 'dropoff', index, stopId: point._id, proof, outcome, failureReason: reason, deliveredQuantities: orders.map((order) => ({ order: typeof order === 'string' ? order : order._id, quantity: Number(quantities[typeof order === 'string' ? order : order._id]) })) });
      onChange();
    } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <View style={{ gap: 10, marginTop: 12 }}>
    {returning ? <Text>Return undelivered goods to the pickup farm, then attach return proof and obtain the farmer’s confirmation.</Text> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['delivered', 'failed', 'partial'] as const).map((value) => <Button key={value} title={`${outcome === value ? '✓ ' : ''}${value}`} disabled={busy} onPress={() => setOutcome(value)} />)}</View>}
    {!returning && outcome !== 'delivered' && <FormField label="Failure reason" value={reason} onChangeText={setReason} maxLength={500} />}
    {!returning && outcome === 'partial' && orders.map((order) => typeof order === 'string' ? null : <FormField key={order._id} label={`${order.orderCode}: delivered quantity (maximum ${order.quantity} ${order.unit})`} value={quantities[order._id] ?? ''} keyboardType="decimal-pad" onChangeText={(value) => setQuantities((current) => ({ ...current, [order._id]: value }))} />)}
    <ProofForm value={proof} onChange={setProof} label={returning ? 'Farmer receiving return' : outcome === 'failed' ? 'Driver confirming failure' : 'Receiver'} />
    <Button title={returning ? 'Confirm goods returned' : 'Save stop outcome & proof'} disabled={busy} onPress={submit} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
