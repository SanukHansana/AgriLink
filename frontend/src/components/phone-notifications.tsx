import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { notificationApi, registerPhonePush, supportsPhonePush } from '@/services/push-notifications';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'expo-router';
import { getApiErrorMessage } from '@/services/api';
import { useLanguage } from '@/i18n/language';
export function PushNotificationObserver() {
  const language = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user || !supportsPhonePush()) return;
    let active = true;
    let remove: (() => void) | undefined;
    void registerPhonePush().catch(() => {});
    void notificationApi().then(async (notifications) => {
      if (!active) return;
      const open = () => router.push('/(app)/notifications');
      const listener = notifications.addNotificationResponseReceivedListener(open);
      remove = () => listener.remove();
      const response = notifications.getLastNotificationResponse();
      if (response) { open(); await notifications.clearLastNotificationResponseAsync(); }
    }).catch(() => {});
    return () => { active = false; remove?.(); };
  }, [user, router, language]);
  return null;
}
export function PhoneNotificationSettings() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const enable = async () => {
    setBusy(true);
    try {
      if (await registerPhonePush(true)) setMessage('Phone notifications enabled. Outbid alerts require an active buyer subscription.');
    } catch (cause) { setMessage(cause instanceof Error && !('isAxiosError' in cause) ? cause.message : getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  };
  return <View style={{ padding: 18, backgroundColor: '#fff', borderRadius: 14, gap: 12 }}>
    <Text style={{ fontSize: 18, color: '#183d2c', fontWeight: '700' }}>Phone notifications</Text>
    <Text>Receive alerts when you are away from AgriLink.</Text>
    <Button title="Enable phone notifications" disabled={busy} onPress={() => void enable()} />
    <Button title="Open notification settings" onPress={() => void Linking.openSettings()} />
    {message && <Text accessibilityRole="alert">{message}</Text>}
  </View>;
}
