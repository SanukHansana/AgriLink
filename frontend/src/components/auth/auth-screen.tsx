import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>A</Text>
            </View>
            <Text style={styles.brandName}>AgriLink</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>{children}</View>
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 36,
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
    marginBottom: 22,
  },
  title: {
    color: '#343434',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#8E918F',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    borderColor: BrandColors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
});
