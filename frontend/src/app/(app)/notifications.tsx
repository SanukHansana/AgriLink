import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { Text } from '@/i18n/native';
import { PhoneNotificationSettings } from '@/components/phone-notifications';
import { Button } from '@/components/button';
import { api, getApiErrorMessage } from '@/services/api';

type Notice = { _id: string; message: string; createdAt: string; readAt?: string };
export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    const load = () => api.get<{ notifications: Notice[] }>('/notifications').then(({ data }) => { if (active) { setItems(data.notifications); setError(null); } }).catch((cause) => { if (active) setError(getApiErrorMessage(cause)); });
    void load(); const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []));
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
    <Button title="Back" onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)')} />
    <Text style={{ fontSize: 26, fontWeight: '700', color: '#183d2c' }}>Notifications</Text>
    <PhoneNotificationSettings />
    {error && <Text style={{ color: '#a33425' }}>{error}</Text>}
    {!items.length && <Text>No notifications yet.</Text>}
    {items.map((item) => <View key={item._id} style={{ padding: 16, borderRadius: 12, backgroundColor: item.readAt ? '#f3f6f3' : '#e5f2e9', gap: 8 }}><Text>{item.message}</Text><Text>{new Date(item.createdAt).toLocaleString()}</Text>{!item.readAt && <Button title="Mark as read" onPress={async () => { try { await api.patch(`/notifications/${item._id}/read`); setItems((current) => current.map((notice) => notice._id === item._id ? { ...notice, readAt: new Date().toISOString() } : notice)); } catch (cause) { setError(getApiErrorMessage(cause)); } }} />}</View>)}
  </ScrollView>;
}
