import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getApiErrorMessage } from '@/services/api';
import type { UserRole } from '@/types/auth';

const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Farmer', value: 'farmer' },
  { label: 'Buyer', value: 'buyer' },
  { label: 'Driver', value: 'driver' },
  { label: 'Agriculture Officer', value: 'agricultureOfficer' },
];

export default function RegisterScreen() {
  const { isLoading, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Complete all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <AuthScreen
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </Link>
        </View>
      }
      subtitle="Create one account and choose how you use AgriLink."
      title="Create your account">
      <FormField
        autoCapitalize="words"
        autoComplete="name"
        label="Full name"
        onChangeText={setName}
        placeholder="Kumara Bandara"
        value={name}
      />
      <FormField
        autoComplete="email"
        keyboardType="email-address"
        label="Email address"
        onChangeText={setEmail}
        placeholder="you@example.com"
        value={email}
      />
      <FormField
        autoComplete="new-password"
        label="Password"
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        value={password}
      />

      <View style={styles.roleGroup}>
        <Text style={styles.roleLabel}>I am joining as</Text>
        <View style={styles.roleOptions}>
          {roleOptions.map((option) => {
            const selected = option.value === role;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => setRole(option.value)}
                style={[styles.roleOption, selected && styles.roleOptionSelected]}>
                <Text style={[styles.roleText, selected && styles.roleTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Create account" loading={isLoading} onPress={handleRegister} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  roleGroup: {
    gap: 8,
  },
  roleLabel: {
    color: '#525552',
    fontSize: 14,
    fontWeight: '700',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    backgroundColor: BrandColors.primarySurface,
    borderColor: BrandColors.primarySoft,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  roleOptionSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  roleText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  roleTextSelected: {
    color: BrandColors.white,
  },
  error: {
    color: BrandColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#777A78',
    fontSize: 14,
  },
  link: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
