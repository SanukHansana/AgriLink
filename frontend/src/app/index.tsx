import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    flex: 1,
    justifyContent: 'center',
  },
});
