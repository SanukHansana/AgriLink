import { useState } from 'react';
import { Button, Text, View } from 'react-native';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { BuyerOrder } from '@/types/transactions';

export function DeliveryDate({ order, onChange }: { order: BuyerOrder; onChange: () => void }) {
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (order.deliveryJob || !['pending', 'confirmed', 'preparing'].includes(order.status)) return null;
  return <View style={{ padding: 16, margin: 16, backgroundColor: '#edf5ef', borderRadius: 12, gap: 10 }}>
    <Text>After a harvest delay, agree a new delivery date with your farmer before pickup is scheduled.</Text>
    {order.requestedDeliveryDate && <Text>Requested delivery: {new Date(order.requestedDeliveryDate).toLocaleDateString()}</Text>}
    <FormField label="New delivery date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
    <Button title="Update requested delivery date" disabled={busy} onPress={async () => { setBusy(true); setError(null); try { await api.patch(`/buyers/orders/${order._id}/delivery-date`, { requestedDeliveryDate: date }); onChange(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } }} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
