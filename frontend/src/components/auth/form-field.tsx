import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { BrandColors } from '@/constants/theme';

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, style, ...inputProps }: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor="#A0A3A1"
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
  },
  label: {
    color: '#525552',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderColor: BrandColors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: '#343434',
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
  },
});
