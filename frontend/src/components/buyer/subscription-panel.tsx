import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { api, getApiErrorMessage } from '@/services/api';

type SubscriptionResponse = {
  subscription: { provider: 'mock'; status: 'active' | 'inactive'; expiresAt: string | null };
  mockAvailable: boolean;
};

export function SubscriptionPanel() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    try { setData((await api.patch<SubscriptionResponse>('/buyers/subscription', { action })).data); }
    catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  const active = data?.subscription.status === 'active';
  return <View style={{ padding: 24, gap: 16 }}>
    <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700' }}>Buyer outbid alerts</Text>
    <Text>Get an in-app notification when another buyer offers a higher price per unit on an active bid.</Text>
    <Text>Demo subscription • No payment or card details required • 30 days • No automatic renewal</Text>
    {data && <Text>{active ? 'Subscription active' : 'Subscription inactive'}</Text>}
    {active && data?.subscription.expiresAt && <Text>Expires: {new Date(data.subscription.expiresAt).toLocaleString('en-LK')}</Text>}
    {data && (active || data.mockAvailable) && <Button title={active ? 'Cancel subscription' : 'Activate demo subscription'} disabled={busy} onPress={() => void change(active ? 'cancel' : 'subscribe')} />}
    {data && !active && !data.mockAvailable && <Text>Demo subscriptions are unavailable on this server.</Text>}
    {busy && <Text>Updating subscription...</Text>}
    {error && <Text accessibilityRole="alert" style={{ color: '#a33425' }}>{error}</Text>}
    <Button title="Refresh subscription" disabled={busy} onPress={() => void load()} />
    <Text>Alerts appear in Notifications while using the app. Background phone push alerts are not enabled in this version.</Text>
  </View>;
}
