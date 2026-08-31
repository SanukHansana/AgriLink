import { Redirect, Tabs } from 'expo-router';

import { BuyerTabIcon } from '@/components/buyer/tab-icon';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function BuyerTabsLayout() {
  const { user } = useAuth();

  if (user?.role !== 'buyer') {
    return <Redirect href="/(app)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: '#969996',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
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
          title: 'Home',
          tabBarIcon: ({ color }) => <BuyerTabIcon color={color} name="home" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <BuyerTabIcon color={color} name="search" />,
        }}
      />
      <Tabs.Screen
        name="wanted"
        options={{
          title: 'Wanted',
          tabBarIcon: ({ color }) => <BuyerTabIcon color={color} name="wanted" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <BuyerTabIcon color={color} name="orders" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <BuyerTabIcon color={color} name="profile" />,
        }}
      />
      <Tabs.Screen name="bid" options={{ href: null }} />
      <Tabs.Screen name="bids" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="tracking" options={{ href: null }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />
      <Tabs.Screen name="cart" options={{ href: null }} />
    </Tabs>
  );
}
