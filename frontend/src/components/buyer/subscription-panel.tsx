import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { BrandColors } from '@/constants/theme';
import { api, getApiErrorMessage } from '@/services/api';
import { MockCardCheckout } from './mock-card-checkout';

type SubscriptionResponse = {
  subscription: { provider: 'mock'; status: 'active' | 'inactive'; expiresAt: string | null };
  mockAvailable: boolean;
};

export function SubscriptionPanel() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState(false);
  const load = async () => {
    setBusy(true); setError(null);
    try { setData((await api.get<SubscriptionResponse>('/buyers/subscription')).data); }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    let mounted = true;
    api.get<SubscriptionResponse>('/buyers/subscription')
      .then(({ data }) => { if (mounted) setData(data); })
      .catch((cause) => { if (mounted) setError(getApiErrorMessage(cause)); })
      .finally(() => { if (mounted) setBusy(false); });
    return () => { mounted = false; };
  }, []);
  const change = async (action: 'subscribe' | 'cancel') => {
    setBusy(true); setError(null);
    try { setData((await api.patch<SubscriptionResponse>('/buyers/subscription', { action })).data); return true; }
    catch (cause) { setError(getApiErrorMessage(cause)); return false; }
    finally { setBusy(false); }
  };
  const active = data?.subscription.status === 'active';
  return <View style={styles.content}>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>AGRILINK BUYER MEMBERSHIP</Text>
      <Text accessibilityRole="header" style={styles.title}>Stay ahead of the next bid</Text>
      <Text style={styles.subtitle}>Get an in-app notification when another buyer offers a higher price per unit on an active bid.</Text>
    </View>
    <View style={styles.card}>
      <View style={styles.headingRow}><Text style={styles.plan}>Outbid alerts</Text><View style={styles.badge}><Text style={styles.badgeText}>{active ? 'Subscription active' : 'Subscription inactive'}</Text></View></View>
      <Text style={styles.price}>Free demo</Text>
      <Text style={styles.detail}>30 days of alerts · Mock card checkout · No automatic renewal</Text>
      <View style={styles.benefits}>
        <Text style={styles.benefit}>✓ Alerts when another buyer outbids your active offer</Text>
        <Text style={styles.benefit}>✓ Review your offers from My Bids</Text>
        <Text style={styles.benefit}>✓ Cancel whenever you want</Text>
      </View>
      {active && data?.subscription.expiresAt && <Text style={styles.expiry}>Expires: {new Date(data.subscription.expiresAt).toLocaleString('en-LK')}</Text>}
      {data && (active || data.mockAvailable) && !checkout && <SubscriptionAction title={active ? 'Cancel subscription' : 'Activate demo subscription'} secondary={active} disabled={busy} onPress={() => { if (active) void change('cancel'); else setCheckout(true); }} />}
      {checkout && !active && <MockCardCheckout busy={busy} onConfirm={() => change('subscribe')} onCancel={() => setCheckout(false)} />}
      {checkout && active && <><Text style={styles.expiry}>Demo checkout complete. No money was charged.</Text><SubscriptionAction title="Cancel subscription" secondary disabled={busy} onPress={() => { setCheckout(false); void change('cancel'); }} /></>}
      {data && !active && !data.mockAvailable && <Text style={styles.detail}>Demo subscriptions are unavailable on this server.</Text>}
      {busy && <View style={styles.loading}><ActivityIndicator color={BrandColors.primary} /><Text style={styles.detail}>Updating subscription...</Text></View>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <SubscriptionAction title="Refresh subscription" secondary disabled={busy} onPress={() => void load()} />
    </View>
    <View style={styles.note}><Text style={styles.noteTitle}>Where to see your alerts</Text><Text style={styles.detail}>Open Notifications to enable phone alerts on a development or production build. Outbid alerts require an active subscription.</Text></View>
  </View>;
}

function SubscriptionAction({ title, secondary = false, disabled, onPress }: { title: string; secondary?: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 880, alignSelf: 'center', padding: 20, gap: 20 },
  hero: { backgroundColor: BrandColors.primarySoft, borderRadius: 20, padding: 26, gap: 12 },
  eyebrow: { color: BrandColors.primaryDark, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: BrandColors.primaryDark, fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#486551', fontSize: 15, lineHeight: 23 },
  card: { backgroundColor: '#fff', borderColor: BrandColors.border, borderWidth: 1, borderRadius: 18, padding: 24, gap: 16 },
  headingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  plan: { color: '#343434', fontSize: 20, fontWeight: '800' },
  badge: { backgroundColor: BrandColors.primarySoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  badgeText: { color: BrandColors.primaryDark, fontWeight: '700', fontSize: 12 },
  price: { color: BrandColors.primary, fontSize: 32, fontWeight: '800' },
  detail: { color: '#626e65', fontSize: 14, lineHeight: 22 },
  benefits: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: BrandColors.border, paddingVertical: 18, gap: 12 },
  benefit: { color: '#365840', fontSize: 14, lineHeight: 22 },
  expiry: { color: BrandColors.primaryDark, fontSize: 14, fontWeight: '600' },
  button: { backgroundColor: BrandColors.primary, minHeight: 50, borderRadius: 24, padding: 14, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { backgroundColor: BrandColors.primarySoft, borderWidth: 1, borderColor: BrandColors.primary },
  secondaryText: { color: BrandColors.primaryDark },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  error: { color: BrandColors.danger, backgroundColor: '#fff0ed', padding: 14, borderRadius: 10 },
  note: { paddingHorizontal: 6, gap: 8 },
  noteTitle: { color: BrandColors.primaryDark, fontSize: 15, fontWeight: '700' },
});
