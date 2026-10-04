import { DateTimeField } from '@/components/date-time-field';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { MarketplaceProduct } from '@/types/marketplace';

export function HarvestActions({ product, onChange }: { product: MarketplaceProduct; onChange: () => void }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = async (status: 'ready' | 'delayed') => {
    setBusy(true); setError(null);
    try { await api.patch(`/farmers/products/${product._id}/harvest`, { harvestStatus: status, harvestDate: status === 'ready' ? new Date().toISOString() : date, note }); onChange(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  return <View style={{ gap: 12, padding: 16, backgroundColor: '#fff', borderRadius: 12 }}>
    <Text style={{ fontWeight: '700' }}>{product.name} · {product.harvestStatus ?? 'growing'}</Text>
    {product.harvestDelayNote && <Text>{product.harvestDelayNote}</Text>}
    <Button title="Mark harvest ready now" disabled={busy || product.harvestStatus === 'ready'} onPress={() => void update('ready')} />
    <DateTimeField label="Revised harvest date" value={date} onChangeText={setDate} />
    <FormField label="Reason for delay" value={note} onChangeText={setNote} maxLength={500} />
    <Button title="Report delay & notify buyers" disabled={busy} onPress={() => void update('delayed')} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
