import { StyleSheet, type TextInputProps, View } from 'react-native';
import { Text, TextInput } from '@/i18n/native';
import { useState, type Ref } from 'react';

import { BrandColors } from '@/constants/theme';

type FormFieldProps = TextInputProps & {
  label: string;
  inputRef?: Ref<TextInput>;
};

export function FormField({ label, style, onFocus, onBlur, inputRef, ...inputProps }: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor="#68736B"
        {...inputProps}
        selectionColor={BrandColors.primary}
        style={[styles.input, style, { backgroundColor: '#fff' }, focused && styles.focused]}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
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
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#9DAF98',
    borderRadius: 12,
    borderWidth: 1,
    color: '#343434',
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 14,
  },
  focused: { borderColor: BrandColors.primaryDark, borderWidth: 2 },
});
