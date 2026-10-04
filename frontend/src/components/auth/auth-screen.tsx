import { BotanicalAccent } from '@/components/botanical-accent';
import { BrandLogo } from '@/components/brand-logo';
import { BrandTagline } from '@/components/brand-tagline';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/i18n/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  footer?: ReactNode;
}>;

export function AuthScreen({ children, footer, subtitle, title }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <BotanicalAccent full />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <BrandLogo width={240} />
            <BrandTagline />
          </View>

          <View style={styles.card}>
            <View style={styles.accentBar} />
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>WELCOME TO AGRILINK</Text>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            {children}
          </View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.background,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brandMarkText: {
    color: BrandColors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  brandName: {
    color: BrandColors.primary,
    fontSize: 30,
    fontWeight: '800',
  },
  heading: {
    gap: 6,
    marginBottom: 8,
  },
  title: {
    color: BrandColors.primaryDark,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#526055',
    fontSize: 15,
    lineHeight: 22,
  },
  accentBar: { width: 48, height: 5, borderRadius: 3, backgroundColor: BrandColors.harvestGold },
  eyebrow: { color: BrandColors.primaryDark, fontSize: 12, letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  card: { backgroundColor: '#fff',
    borderColor: BrandColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    padding: 24,
    boxShadow: '0px 8px 24px rgba(35, 66, 38, 0.08)',
  },
});
