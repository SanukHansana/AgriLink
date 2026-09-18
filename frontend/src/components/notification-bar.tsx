import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, Pressable, Text } from 'react-native';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

export function NotificationBar() {
  const router = useRouter();
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const load = useCallback(() => {
    if (AppState.currentState !== 'active') return;
    api.get<{ notifications: { readAt?: string }[] }>('/notifications').then(({ data }) => setCount(data.notifications.filter((item) => !item.readAt).length)).catch(() => {});
  }, []);
  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, [load]);
  if (user?.role === 'agricultureOfficer' && !user.isVerified) return null;
  return <Pressable accessibilityRole="button" onPress={() => router.push('/(app)/notifications')} style={{ paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#e9f2ec', alignItems: 'flex-end' }}><Text style={{ color: '#216b43', fontWeight: '700' }}>Notifications{count ? ` (${count})` : ''}</Text></Pressable>;
}
