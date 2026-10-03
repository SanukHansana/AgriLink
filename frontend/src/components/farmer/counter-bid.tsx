import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { BuyerBid } from '@/types/transactions';

export function CounterBid({ bid, onChange }: { bid: BuyerBid; onChange: () => void }) {
  const [amount, setAmount] = useState(String(bid.counterAmount ?? bid.bidAmount));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!['active', 'countered'].includes(bid.status)) return null;
  return <View style={{ gap: 10, marginTop: 14 }}>
    {bid.status === 'countered' && <Text>Awaiting buyer response to LKR {bid.counterAmount}/{bid.unit}.</Text>}
    <FormField label="Counter-offer price per unit" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
    <Button title="Send counter-offer" disabled={busy} onPress={async () => { setBusy(true); setError(null); try { await api.patch(`/farmers/bids/${bid._id}/counter`, { counterAmount: Number(amount) }); onChange(); } catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); } }} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
