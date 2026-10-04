import { translate, useLanguage } from '@/i18n/language';
import { Redirect, Tabs } from 'expo-router';

import { FarmerTabIcon } from '@/components/farmer/farmer-tab-icon';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function FarmerTabsLayout() {
  useLanguage();
  const { user } = useAuth();
  if (user?.role !== 'farmer') return <Redirect href="/(app)" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: BrandColors.primary, tabBarInactiveTintColor: '#969996', tabBarLabelStyle: { fontSize: 10, fontWeight: '700' }, tabBarStyle: { backgroundColor: BrandColors.cream, borderTopColor: BrandColors.border, height: 72, paddingBottom: 8, paddingTop: 6 } }}>
      <Tabs.Screen name="index" options={{ title: translate('Home'), tabBarIcon: ({ color }) => <FarmerTabIcon color={color} name="home" /> }} />
      <Tabs.Screen name="products" options={{ title: translate('Products'), tabBarIcon: ({ color }) => <FarmerTabIcon color={color} name="products" /> }} />
      <Tabs.Screen name="orders" options={{ title: translate('Orders'), tabBarIcon: ({ color }) => <FarmerTabIcon color={color} name="orders" /> }} />
      <Tabs.Screen name="cooperative" options={{ title: translate('Co-op'), tabBarIcon: ({ color }) => <FarmerTabIcon color={color} name="cooperative" /> }} />
      <Tabs.Screen name="profile" options={{ title: translate('Profile'), tabBarIcon: ({ color }) => <FarmerTabIcon color={color} name="profile" /> }} />
      <Tabs.Screen name="bids" options={{ href: null }} />
      <Tabs.Screen name="updates" options={{ href: null }} />
      <Tabs.Screen name="assistance" options={{ href: null }} />
      <Tabs.Screen name="pickup" options={{ href: null }} />
    </Tabs>
  );
}
