import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function AdminLayout() {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Redirect href="/(app)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
