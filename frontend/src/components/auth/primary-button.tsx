import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { BrandColors } from '@/constants/theme';

type PrimaryButtonProps = {
  label: string;
  loading?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, loading = false, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={BrandColors.white} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: {
    backgroundColor: BrandColors.primaryDark,
  },
  disabled: {
    opacity: 0.7,
  },
  label: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
