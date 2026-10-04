import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormField } from '@/components/auth/form-field';
import { Button } from '@/components/button';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

type DemoCard = { last4: string; expiry: string };
export function MockCardCheckout({ busy, onConfirm, onCancel, summary = 'Outbid alerts · 30 days\nTotal today: LKR 0 · No automatic renewal', confirmLabel = 'Confirm demo subscription' }: { busy: boolean; onConfirm: (card: DemoCard) => Promise<boolean>; onCancel: () => void; summary?: string; confirmLabel?: string }) {
  const { user } = useAuth();
  const key = `agrilink-demo-card-${user?.id ?? 'guest'}`;
  const [saved, setSaved] = useState<DemoCard | null>(null);
  const [useSaved, setUseSaved] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [code, setCode] = useState('');
  const [save, setSave] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(key).then((raw) => {
      if (!mounted || !raw) return;
      const card = JSON.parse(raw) as DemoCard;
      if (/^\d{4}$/.test(card.last4) && /^\d{2}\/\d{2}$/.test(card.expiry)) { setSaved(card); setUseSaved(true); }
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [key]);
  const confirm = async () => {
    setError(null);
    const card = useSaved ? saved : { last4: number.replace(/\s/g, '').slice(-4), expiry };
    const match = card && /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(card.expiry);
    if (!match || new Date(2000 + Number(match[2]), Number(match[1]), 1) <= new Date()) { setError('Enter a valid future expiry date (MM/YY).'); return; }
    if (!useSaved && (name.trim().length < 2 || number.replace(/\s/g, '') !== '4242424242424242' || !/^\d{3}$/.test(code))) {
      setError('Use demo card 4242 4242 4242 4242, a name, and any three-digit security code.'); return;
    }
    setSubmitting(true);
    try {
      if (!card || !await onConfirm(card)) return;
      if (!useSaved && save && card && user) await AsyncStorage.setItem(key, JSON.stringify(card)).catch(() => {});
    } finally { setSubmitting(false); setNumber(''); setCode(''); }
  };
  return <View style={{ gap: 16, padding: 18, borderWidth: 1, borderColor: BrandColors.border, borderRadius: 16, backgroundColor: '#fff' }}>
    <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '800', color: BrandColors.primaryDark }}>Demo checkout</Text>
    <Text style={{ fontSize: 16, color: '#486551', lineHeight: 24 }}>{summary}</Text>
    <Text style={{ fontSize: 14, lineHeight: 22 }}>Mock payment only. Use 4242 4242 4242 4242, a future expiry and any three-digit code. Do not enter a real card.</Text>
    {saved && <View style={{ gap: 10 }}><Pressable accessibilityRole="radio" accessibilityState={{ checked: useSaved }} onPress={() => setUseSaved(true)} style={{ padding: 16, borderWidth: 2, borderColor: useSaved ? BrandColors.primaryDark : BrandColors.border, borderRadius: 12, backgroundColor: '#fff' }}><Text style={{ fontSize: 17, fontWeight: '700', color: BrandColors.primaryDark }}>Demo Visa •••• {saved.last4}</Text><Text>Expires {saved.expiry}{useSaved ? ' · Selected' : ''}</Text></Pressable><Button title="Use another demo card" onPress={() => setUseSaved(false)} disabled={busy || submitting} /><Button title="Remove saved demo card" disabled={busy || submitting} onPress={async () => { try { await AsyncStorage.removeItem(key); setSaved(null); setUseSaved(false); } catch { setError('Could not remove the saved card. Try again.'); } }} /></View>}
    {!useSaved && <View style={{ gap: 14 }}>
      <FormField label="Cardholder name" value={name} onChangeText={setName} autoComplete="off" maxLength={80} />
      <FormField label="Demo card number" value={number} onChangeText={(text) => setNumber(text.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} keyboardType="number-pad" placeholder="4242 4242 4242 4242" autoComplete="off" />
      <FormField label="Expiry (MM/YY)" value={expiry} onChangeText={(text) => { const digits = text.replace(/\D/g, '').slice(0, 4); setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits); }} keyboardType="number-pad" placeholder="MM/YY" autoComplete="off" />
      <FormField label="Security code" value={code} onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 3))} keyboardType="number-pad" secureTextEntry maxLength={3} autoComplete="off" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><Switch accessibilityLabel="Save demo card" value={save} onValueChange={setSave} trackColor={{ true: BrandColors.primary, false: '#ddd' }} /><Text style={{ flex: 1, fontSize: 16 }}>Save demo card for next time</Text></View>
      <Text>Only the last four digits and expiry are saved on this device.</Text>
    </View>}
    {error && <Text accessibilityRole="alert" style={{ color: BrandColors.danger }}>{error}</Text>}
    <Button title={busy || submitting ? 'Processing...' : confirmLabel} disabled={busy || submitting || loading} onPress={() => void confirm()} />
    <Button title="Cancel checkout" disabled={busy || submitting} onPress={onCancel} />
  </View>;
}
