import { useState } from 'react';
import { View } from 'react-native';
import { Alert, Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { MockCardCheckout } from './mock-card-checkout';
import { api, getApiErrorMessage } from '@/services/api';
import type { BuyerOrder } from '@/types/transactions';
import { formatLkr } from '@/utils/formatters';
import { BrandColors } from '@/constants/theme';
export function OrderPaymentActions({ order, onChange }: { order: BuyerOrder; onChange: () => void }) {
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const receive = async () => {
    setBusy(true); setError(null);
    try { await api.post(`/buyers/orders/${order._id}/received`); onChange(); }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 12, marginTop: 14 }}>
    <Text style={{ color: BrandColors.primaryDark, fontSize: 16, fontWeight: '700' }}>{order.paymentStatus === 'paid' ? 'Paid (demo)' : order.status === 'pending' ? 'Payment available after farmer accepts' : 'Awaiting payment'}</Text>
    {order.status === 'confirmed' && order.paymentStatus !== 'paid' && !checkout && <Button title="Pay for order (demo)" onPress={() => setCheckout(true)} />}
    {checkout && <MockCardCheckout busy={busy} summary={`${order.orderCode}\n${order.quantity} ${order.unit} · Total: ${formatLkr(order.totalAmount)}\nDemo payment — no charge`} confirmLabel="Confirm order payment (demo)" onCancel={() => setCheckout(false)} onConfirm={async (card) => {
      setBusy(true); setError(null);
      try { await api.post(`/buyers/orders/${order._id}/payment`, { provider: 'mock', ...card }); setCheckout(false); onChange(); return true; }
      catch (cause) { setError(getApiErrorMessage(cause)); return false; }
      finally { setBusy(false); }
    }} />}
    {order.receivedAt ? <Text style={{ color: BrandColors.primaryDark, fontSize: 16 }}>✓ Receipt confirmed</Text> : order.status === 'delivered' && <Button title="Confirm received" disabled={busy} onPress={() => Alert.alert('Confirm receipt?', 'Confirm only after you have received your goods.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Received', onPress: () => void receive() }])} />}
    {error && <Text accessibilityRole="alert" style={{ color: BrandColors.danger }}>{error}</Text>}
  </View>;
}
