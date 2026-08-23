import { Redirect, Tabs } from 'expo-router';

import { OfficerTabIcon } from '@/components/advisory/officer-tab-icon';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function OfficerTabsLayout() {
  const { user } = useAuth();
  if (user?.role !== 'agricultureOfficer') return <Redirect href="/(app)" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: '#969996',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: BrandColors.white,
          borderTopColor: BrandColors.border,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="dashboard" />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="requests" />,
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="notices" />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="reports" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <OfficerTabIcon color={color} name="profile" />,
        }}
      />
    </Tabs>
  );
}
