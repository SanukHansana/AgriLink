import { LanguagePicker } from '@/components/language-picker';
import { BrandTagline } from '@/components/brand-tagline';
import { BellIcon } from '@/components/bell-icon';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';
import { BrandLogo } from '@/components/brand-logo';
import { BotanicalAccent } from '@/components/botanical-accent';
import { BrandColors } from '@/constants/theme';
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
  return <View style={{ paddingHorizontal: 16, backgroundColor: BrandColors.cream, borderBottomWidth: 1, borderBottomColor: '#DCE5CD', overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><BotanicalAccent /><View style={{ flex: 1, minWidth: 140, gap: 2, paddingVertical: 6 }}><BrandLogo width={160} /><BrandTagline compact /></View><View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><LanguagePicker /><Pressable accessibilityRole="button" accessibilityLabel={count ? `Notifications, ${count} unread` : 'Notifications'} hitSlop={8} onPress={() => router.push('/(app)/notifications')} style={{ height: 52, width: 52, marginVertical: 8, backgroundColor: BrandColors.primaryDark, borderRadius: 26, alignItems: 'center', justifyContent: 'center' }}><BellIcon />{count > 0 && <View style={{ position: 'absolute', top: -3, right: -5, minWidth: 22, height: 22, paddingHorizontal: 5, borderRadius: 11, backgroundColor: '#B42318', borderWidth: 2, borderColor: BrandColors.cream, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{count > 99 ? '99+' : count}</Text></View>}</Pressable></View></View>;
}
