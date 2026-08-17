import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getApiErrorMessage } from '@/services/api';

export default function LoginScreen() {
  const { isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  };

  return (
    <AuthScreen
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to AgriLink?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      }
      subtitle="Connect farms, markets, transport and agricultural support."
      title="Welcome back">
      <FormField
        autoComplete="email"
        keyboardType="email-address"
        label="Email address"
        onChangeText={setEmail}
        placeholder="you@example.com"
        value={email}
      />
      <FormField
        autoComplete="current-password"
        label="Password"
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Log in" loading={isLoading} onPress={handleLogin} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
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
