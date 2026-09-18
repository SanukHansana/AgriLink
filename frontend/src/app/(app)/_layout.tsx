import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationBar } from '@/components/notification-bar';

export default function AppLayout() {
  return <View style={{ flex: 1 }}><SafeAreaView edges={['top']}><NotificationBar /></SafeAreaView><Stack screenOptions={{ headerShown: false }} /></View>;
}
