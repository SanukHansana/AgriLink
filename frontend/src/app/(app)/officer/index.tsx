import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvisoryState } from '@/components/advisory/advisory-state';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useOfficerOverview } from '@/hooks/use-officer-overview';

export default function OfficerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const state = useOfficerOverview();

  if (state.isLoading && state.requests.length === 0) {
    return <SafeAreaView style={styles.safeArea}><AdvisoryState isLoading /></SafeAreaView>;
  }
  if (state.error && state.requests.length === 0) {
    return <SafeAreaView style={styles.safeArea}><AdvisoryState error={state.error} onRetry={state.refresh} /></SafeAreaView>;
  }

  const pending = state.requests.filter((item) => item.status === 'pending').length;
  const activeNotices = state.notices.filter((item) => item.status === 'published').length;
  const resolved = state.requests.filter((item) => ['approved', 'rejected', 'resolved'].includes(item.status)).length;
  const firstName = user?.name.split(' ')[0] ?? 'Officer';
  const urgentRequest = state.requests.find((item) => item.priority === 'high' && item.status === 'pending');
  const emergencyNotice = state.notices.find((item) => item.isEmergency && item.status === 'published');

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={state.refresh} refreshing={state.isLoading} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.centerName}>{state.profile?.assignedCenter.name ?? 'Agriculture Advisory Center'}</Text>
          <Text style={styles.greeting}>Mr./Ms. {firstName},</Text>
          <Text style={styles.roleText}>
            Agriculture Officer · {state.profile?.assignedCenter.district ?? 'Sri Lanka'}
          </Text>
        </View>

        {!state.profile ? (
          <Pressable onPress={() => router.push('/(app)/officer/profile' as Href)} style={styles.setupBanner}>
            <View style={styles.setupCopy}>
              <Text style={styles.setupTitle}>Complete your officer profile</Text>
              <Text style={styles.setupText}>Add your employee ID, center, district and specialization.</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>
        <View style={styles.metricsGrid}>
          <Metric color={BrandColors.warning} label="Pending Requests" value={String(pending)} />
          <Metric color={BrandColors.primary} label="Active Notices" value={String(activeNotices)} />
          <Metric color="#414441" label="Requests Resolved" value={String(resolved)} />
          <Metric color={BrandColors.danger} label="Urgent Requests" value={String(state.requests.filter((item) => item.priority === 'high' && item.status === 'pending').length)} />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickAction label="Review Requests" symbol="✓" onPress={() => router.push('/(app)/officer/requests' as Href)} />
          <QuickAction label="Create Notice" symbol="!" onPress={() => router.push('/(app)/officer/notices' as Href)} />
          <QuickAction label="View Reports" symbol="↗" onPress={() => router.push('/(app)/officer/reports' as Href)} />
        </View>

        {emergencyNotice ? (
          <View style={styles.alertCard}>
            <Text style={styles.alertSymbol}>!</Text>
            <View style={styles.alertCopy}>
              <Text style={styles.alertTitle}>{emergencyNotice.title}</Text>
              <Text numberOfLines={2} style={styles.alertText}>{emergencyNotice.description}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Farmer Requests</Text>
          <Pressable onPress={() => router.push('/(app)/officer/requests' as Href)}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>
        {state.requests.slice(0, 2).map((item) => (
          <Pressable
            key={item._id}
            onPress={() => router.push(`/(app)/officer/requests/${item._id}` as Href)}
            style={styles.activityCard}>
            <View style={[styles.avatar, item.priority === 'high' && styles.urgentAvatar]}>
              <Text style={styles.avatarText}>{item.farmer.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.activityCopy}>
              <Text numberOfLines={2} style={styles.activityTitle}>{item.farmer.name} · {item.title}</Text>
              <Text style={styles.activityMeta}>{relativeTime(item.createdAt)} · {item.farmLocation.district}</Text>
            </View>
          </Pressable>
        ))}
        {state.requests.length === 0 ? <AdvisoryState emptyMessage="Farmer assistance requests will appear here." /> : null}
        {urgentRequest ? <Text style={styles.urgentHint}>High-priority request awaiting review: {urgentRequest.title}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ color, label, value }: { color: string; label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, { color }]}>{value}</Text></View>;
}

function QuickAction({ label, onPress, symbol }: { label: string; onPress: () => void; symbol: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickAction}><Text style={styles.quickSymbol}>{symbol}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

function relativeTime(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(value).toLocaleDateString('en-LK');
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { paddingBottom: 30 },
  hero: { backgroundColor: BrandColors.primary, paddingHorizontal: 20, paddingVertical: 18 },
  centerName: { color: '#D9F3E3', fontSize: 12 },
  greeting: { color: BrandColors.white, fontSize: 21, fontWeight: '800', marginTop: 10 },
  roleText: { color: '#D9F3E3', fontSize: 11, marginTop: 7 },
  setupBanner: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, flexDirection: 'row', margin: 16, marginBottom: 0, padding: 14, borderRadius: 13 },
  setupCopy: { flex: 1 },
  setupTitle: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' },
  setupText: { color: '#6F806F', fontSize: 10, marginTop: 3 },
  arrow: { color: BrandColors.primary, fontSize: 24 },
  sectionTitle: { color: '#4A4D4A', fontSize: 14, fontWeight: '800', marginHorizontal: 16, marginTop: 18 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginTop: 10 },
  metric: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, padding: 13, width: '48%' },
  metricLabel: { color: '#999C99', fontSize: 10 },
  metricValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 9, marginHorizontal: 16, marginTop: 10 },
  quickAction: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 12, flex: 1, paddingHorizontal: 6, paddingVertical: 14 },
  quickSymbol: { color: BrandColors.primary, fontSize: 21, fontWeight: '800' },
  quickLabel: { color: BrandColors.primary, fontSize: 9, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  alertCard: { backgroundColor: '#FFF0C4', borderRadius: 13, flexDirection: 'row', marginHorizontal: 16, marginTop: 18, padding: 14 },
  alertSymbol: { color: BrandColors.warning, fontSize: 21, fontWeight: '800' },
  alertCopy: { flex: 1, marginLeft: 12 },
  alertTitle: { color: BrandColors.warning, fontSize: 11, fontWeight: '800' },
  alertText: { color: '#786B45', fontSize: 10, lineHeight: 15, marginTop: 4 },
  sectionRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', paddingRight: 16 },
  viewAll: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  activityCard: { alignItems: 'center', backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginHorizontal: 16, marginTop: 10, padding: 12 },
  avatar: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  urgentAvatar: { backgroundColor: '#FFE4E4' },
  avatarText: { color: BrandColors.primary, fontSize: 15, fontWeight: '800' },
  activityCopy: { flex: 1, marginLeft: 11 },
  activityTitle: { color: '#464946', fontSize: 11, fontWeight: '800' },
  activityMeta: { color: '#999C99', fontSize: 9, marginTop: 4 },
  urgentHint: { color: BrandColors.danger, fontSize: 9, marginHorizontal: 16, marginTop: 12 },
});
