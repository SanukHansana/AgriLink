import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/button';
import { FormField } from '@/components/auth/form-field';
import { api, getApiErrorMessage } from '@/services/api';
import type { BuyerBid } from '@/types/transactions';

export function BidActions({ bid, onChange }: { bid: BuyerBid; onChange: () => void }) {
  const [amount, setAmount] = useState(String(bid.bidAmount));
  const [quantity, setQuantity] = useState(String(bid.quantity));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const action = async (action: string) => {
    setBusy(true); setError(null);
    try { await api.patch(`/buyers/bids/${bid._id}`, { action, bidAmount: Number(amount), quantity: Number(quantity) }); setEditing(false); onChange(); }
    catch (cause) { setError(getApiErrorMessage(cause)); } finally { setBusy(false); }
  };
  if (!['active', 'countered'].includes(bid.status)) return null;
  return <View style={{ marginTop: 14, gap: 10 }}>
    {bid.status === 'countered' && <><Text>Farmer counter-offer: LKR {bid.counterAmount}/{bid.unit}. Accepting creates a confirmed order.</Text><Button title="Accept counter-offer & place order" disabled={busy} onPress={() => void action('acceptCounter')} /><Button title="Decline counter-offer" disabled={busy} onPress={() => void action('declineCounter')} /></>}
    <Button title={editing ? 'Cancel edit' : 'Edit bid'} disabled={busy} onPress={() => setEditing(!editing)} />
    {editing && <><FormField label="Bid price per unit" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} /><FormField label="Quantity" keyboardType="decimal-pad" value={quantity} onChangeText={setQuantity} /><Button title="Save revised bid" disabled={busy} onPress={() => void action('edit')} /></>}
    <Button title="Withdraw bid" disabled={busy} onPress={() => void action('withdraw')} />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
  </View>;
}
