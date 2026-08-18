import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

type MarketplaceStateProps = {
  error?: string | null;
  isLoading?: boolean;
  onRetry?: () => void;
};

export function MarketplaceState({ error, isLoading, onRetry }: MarketplaceStateProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
        <Text style={styles.message}>Loading fresh products…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.symbol}>{error ? '!' : '🌱'}</Text>
      <Text style={styles.title}>{error ? 'Unable to load products' : 'No products found'}</Text>
      <Text style={styles.message}>
        {error ?? 'Try another category or check again after farmers add new harvests.'}
      </Text>
      {error && onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 44,
  },
  symbol: {
    color: BrandColors.danger,
    fontSize: 32,
    fontWeight: '800',
  },
  title: {
    color: '#454745',
    fontSize: 17,
    fontWeight: '800',
  },
  message: {
    color: '#969996',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 18,
    marginTop: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
