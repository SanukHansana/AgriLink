import { translate, useLanguage } from '@/i18n/language';
import { Redirect, Tabs } from 'expo-router';

import { DriverTabIcon } from '@/components/driver/driver-tab-icon';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function DriverTabsLayout() {
  useLanguage();
  const { user } = useAuth();
  if (user?.role !== 'driver') return <Redirect href="/(app)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: '#969996',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
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
          title: translate('Home'),
          tabBarIcon: ({ color }) => <DriverTabIcon color={color} name="home" />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: translate('Jobs'),
          tabBarIcon: ({ color }) => <DriverTabIcon color={color} name="jobs" />,
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: translate('Active'),
          tabBarIcon: ({ color }) => <DriverTabIcon color={color} name="active" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: translate('History'),
          tabBarIcon: ({ color }) => <DriverTabIcon color={color} name="history" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: translate('Profile'),
          tabBarIcon: ({ color }) => <DriverTabIcon color={color} name="profile" />,
        }}
      />
      <Tabs.Screen name="status" options={{ href: null }} />
      <Tabs.Screen name="earnings" options={{ href: null }} />
      <Tabs.Screen name="issues" options={{ href: null }} />
    </Tabs>
  );
}
