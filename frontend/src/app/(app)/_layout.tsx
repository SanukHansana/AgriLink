import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationBar } from '@/components/notification-bar';
import { OfflineStatus } from '@/components/driver/offline-status';

export default function AppLayout() {
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <View style={{ flex: 1 }}><SafeAreaView edges={['top']}><NotificationBar /><OfflineStatus /></SafeAreaView><Stack screenOptions={{ headerShown: false }} /></View>;
}
