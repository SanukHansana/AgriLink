import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

type BuyerDataStateProps = {
  emptyMessage?: string;
  emptyTitle?: string;
  error?: string | null;
  isLoading?: boolean;
  loadingMessage?: string;
  onRetry?: () => void;
};

export function BuyerDataState({
  emptyMessage = 'There is nothing to show yet.',
  emptyTitle = 'No records found',
  error,
  isLoading,
  loadingMessage = 'Loading…',
  onRetry,
}: BuyerDataStateProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
        <Text style={styles.message}>{loadingMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, error && styles.errorSymbol]}>{error ? '!' : '○'}</Text>
      <Text style={styles.title}>{error ? 'Unable to load information' : emptyTitle}</Text>
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
  container: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  symbol: {
    color: BrandColors.primary,
    fontSize: 34,
    fontWeight: '800',
  },
  errorSymbol: {
    color: BrandColors.danger,
  },
  title: {
    color: '#454745',
    fontSize: 17,
    fontWeight: '800',
  },
  message: {
    color: '#929592',
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
