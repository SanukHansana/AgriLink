import { BotanicalAccent } from '@/components/botanical-accent';
import { BrandLogo } from '@/components/brand-logo';
import { BrandTagline } from '@/components/brand-tagline';
import { Link, usePathname } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';

type AuthScreenProps = PropsWithChildren<{ title: string; subtitle: string; footer?: ReactNode }>;

export function AuthScreen({ children, footer, subtitle, title }: AuthScreenProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 960;
  const registration = usePathname().endsWith('/register');

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} keyboardShouldPersistTaps="handled">
      <View style={[styles.shell, desktop && styles.desktopShell]}>
        <View style={[styles.brandPanel, desktop ? styles.desktopBrand : styles.compactBrand]}>
          <View style={{ gap: 16 }}><View style={styles.brandRow}><View style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14 }}><BrandLogo width={220} /></View></View><BrandTagline light /></View>
          {desktop && <>
            <View style={styles.story}>
              <Text style={styles.eyebrow}>GROWING CONNECTIONS</Text>
              <Text style={styles.hero}>A better way to{ '\n' }grow together.</Text>
              <Text style={styles.description}>From the farm to the marketplace, connect with the people who keep agriculture moving.</Text>
              <View style={styles.features}>
                {[
                  ['01', 'Farm & marketplace', 'Connect farmers with buyers and new opportunities.'],
                  ['02', 'Transport & delivery', 'Keep produce moving from harvest to doorstep.'],
                  ['03', 'Agricultural support', 'Bring communities and verified officers together.'],
                ].map(([number, label, detail]) => <View key={number} style={styles.feature}><Text style={styles.featureNumber}>{number}</Text><View style={{ flex: 1, gap: 5 }}><Text style={styles.featureTitle}>{label}</Text><Text style={styles.featureDetail}>{detail}</Text></View></View>)}
              </View>
            </View>
            <Text style={styles.brandFooter}>Connected farms. Stronger communities.</Text>
          </>}
        </View>
        <View style={[styles.formPanel, desktop && styles.desktopForm]}>
          <BotanicalAccent full />
          <View style={styles.formContent}>
            <View style={styles.tabs}>
              {([{ label: 'Log in', href: '/(auth)/login', selected: !registration }, { label: 'Sign up', href: '/(auth)/register', selected: registration }] as const).map((tab) => <Link key={tab.label} href={tab.href} asChild><Pressable accessibilityRole="link" accessibilityState={{ selected: tab.selected }} style={StyleSheet.flatten([styles.tab, tab.selected && styles.selectedTab])}><Text style={[styles.tabText, tab.selected && styles.selectedTabText]}>{tab.label}</Text></Pressable></Link>)}
            </View>
            <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>
            <View style={styles.fields}>{children}</View>
            {footer}
            <Text style={styles.note}>{registration ? 'Agriculture officer accounts require administrator verification before accessing officer features.' : 'Use your AgriLink account to access your dashboard.'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F5E7' },
  pageContent: { flexGrow: 1 },
  shell: { flexGrow: 1, width: '100%', backgroundColor: '#fff' },
  desktopShell: { flexDirection: 'row' },
  brandPanel: { backgroundColor: '#153d2b', padding: 32 },
  desktopBrand: { width: '44%', padding: 48, justifyContent: 'space-between' },
  compactBrand: { paddingVertical: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#e9f2ec', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#216b43', fontWeight: '800', fontSize: 24 },
  brandName: { color: '#fff', fontSize: 28, fontWeight: '800' },
  story: { gap: 20, paddingVertical: 48 },
  eyebrow: { color: '#b5cebf', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  hero: { color: '#fff', fontSize: 42, fontWeight: '800', lineHeight: 50 },
  description: { color: '#c4d8cb', fontSize: 16, lineHeight: 26 },
  features: { gap: 24, marginTop: 18 },
  feature: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  featureNumber: { color: '#bed8c6', fontSize: 12, fontWeight: '700', padding: 10, backgroundColor: '#28533c', borderRadius: 8 },
  featureTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  featureDetail: { color: '#b5cebf', fontSize: 13, lineHeight: 21 },
  brandFooter: { color: '#b5cebf', fontSize: 12 },
  formPanel: { backgroundColor: '#FFFCF3', overflow: 'hidden', flex: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
  desktopForm: { padding: 48 },
  formContent: { width: '100%', maxWidth: 480, alignSelf: 'center', padding: 28, backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#DCE5CD', boxShadow: '0px 12px 32px rgba(35, 66, 38, 0.08)' },
  tabs: { flexDirection: 'row', backgroundColor: '#f3f6f3', borderRadius: 10, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 7, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  selectedTab: { backgroundColor: '#006F2B', borderColor: '#006F2B' },
  tabText: { color: '#64736b', fontSize: 16, fontWeight: '600' },
  selectedTabText: { color: '#fff' },
  heading: { gap: 10, marginBottom: 28 },
  title: { color: '#183d2c', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#64736b', fontSize: 15, lineHeight: 23 },
  fields: { gap: 18 },
  note: { color: '#64736b', fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 28 },
});
