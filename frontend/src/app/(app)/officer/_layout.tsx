import { translate, useLanguage } from '@/i18n/language';
import { Redirect, Tabs } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/i18n/native';
import { Button } from '@/components/button';
import { getApiErrorMessage } from '@/services/api';

import { OfficerTabIcon } from '@/components/advisory/officer-tab-icon';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function OfficerTabsLayout() {
  useLanguage();
  const { user, logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (user?.role !== 'agricultureOfficer') return <Redirect href="/(app)" />;
  if (!user.isVerified || !user.officerDistrict) return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 32, gap: 20, backgroundColor: '#f3f6f3' }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#183d2c' }}>{user.isVerified ? 'Awaiting district assignment' : 'Awaiting admin verification'}</Text>
      <Text>An administrator must verify your account and assign your service district before you can access officer features.</Text>
      {error && <Text accessibilityRole="alert" style={{ color: '#a33425' }}>{error}</Text>}
      <Button title={checking ? 'Checking…' : 'Check verification status'} disabled={checking} onPress={async () => {
        setChecking(true); setError(null);
        try { await refreshUser(); } catch (cause) { setError(getApiErrorMessage(cause)); }
        finally { setChecking(false); }
      }} />
      <Button title="Sign out" onPress={logout} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: '#969996',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: BrandColors.cream,
          borderTopColor: BrandColors.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: translate('Dashboard'),
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="dashboard" />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: translate('Requests'),
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="requests" />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: translate('Notices'),
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="notices" />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: translate('Reports'),
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="reports" />,
        }}
      />
      <Tabs.Screen name="visits" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: translate('Profile'),
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="profile" />,
        }}
      />
    </Tabs>
  );
}
