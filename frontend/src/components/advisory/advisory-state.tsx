import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

export function AdvisoryState({
  emptyMessage = 'No advisory information is available yet.',
  error,
  isLoading,
  onRetry,
}: {
  emptyMessage?: string;
  error?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
        <Text style={styles.message}>Loading advisory information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, error && styles.errorSymbol]}>{error ? '!' : '○'}</Text>
      <Text style={styles.title}>{error ? 'Unable to load advisory data' : 'Nothing here yet'}</Text>
      <Text style={styles.message}>{error ?? emptyMessage}</Text>
      {error && onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 45 },
  symbol: { color: BrandColors.primary, fontSize: 32, fontWeight: '800' },
  errorSymbol: { color: BrandColors.danger },
  title: { color: '#454845', fontSize: 16, fontWeight: '800' },
  message: { color: '#949794', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 18,
    marginTop: 6,
    paddingHorizontal: 17,
    paddingVertical: 9,
  },
  retryText: { color: BrandColors.white, fontSize: 12, fontWeight: '800' },
});
