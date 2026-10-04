import { Stack } from 'expo-router';
import '@/services/background-location';
import { ActivityIndicator, View } from 'react-native';
import { LanguagePicker, LanguageRestore } from '@/components/language-picker';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PushNotificationObserver } from '@/components/phone-notifications';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isRestoring } = useAuth();
  if (isRestoring) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>{!isAuthenticated && <View style={{ position: 'absolute', right: 16, top: insets.top + 12, zIndex: 20 }}><LanguagePicker /></View>}<Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack></View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider><LanguageRestore />
          <StatusBar style="dark" />
          <RootNavigator />
          <PushNotificationObserver />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
