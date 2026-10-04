import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, type TextInput, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';

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
  const [showPassword, setShowPassword] = useState(false);
  const passwordInput = useRef<TextInput>(null);

  const handleLogin = async () => {
    if (isLoading) return;
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address, such as name@example.com.');
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
            <Pressable accessibilityRole="link" style={styles.createLink}>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </Link>
        </View>
      }
      subtitle="Your farm, your market, your community. Sign in to continue."
      title="Good to see you again">
      <FormField
        autoComplete="email"
        keyboardType="email-address"
        label="Email address"
        onChangeText={(value) => { setEmail(value); setError(null); }}
        placeholder="you@example.com"
        value={email}
        editable={!isLoading}
        returnKeyType="next"
        onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        autoComplete="current-password"
        label="Password"
        inputRef={passwordInput}
        onChangeText={(value) => { setPassword(value); setError(null); }}
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        editable={!isLoading}
        onSubmitEditing={handleLogin}
        returnKeyType="go"
        value={password}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} accessibilityState={{ selected: showPassword, disabled: isLoading }} disabled={isLoading} onPress={() => setShowPassword(!showPassword)} style={styles.visibilityButton}><Text style={styles.visibilityText}>{showPassword ? 'Hide password' : 'Show password'}</Text></Pressable>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Log in" loading={isLoading} onPress={handleLogin} />
      {isLoading && <Text accessibilityLiveRegion="polite" style={styles.progress}>Signing you in…</Text>}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: BrandColors.danger,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#FFF1EE',
    padding: 14,
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginTop: 22,
  },
  footerText: {
    color: '#526055',
    fontSize: 16,
  },
  link: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  createLink: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  visibilityButton: { minHeight: 44, alignSelf: 'flex-end', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: BrandColors.primarySurface, marginTop: -8 },
  visibilityText: { color: BrandColors.primaryDark, fontSize: 15, fontWeight: '700' },
  progress: { color: BrandColors.primaryDark, fontSize: 16, textAlign: 'center' },
});
