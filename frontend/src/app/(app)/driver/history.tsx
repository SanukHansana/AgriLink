import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverIssues } from '@/hooks/use-driver-issues';
import { useDriverJobs } from '@/hooks/use-driver-jobs';
import type { DeliveryJob } from '@/types/logistics';
import { formatLkr } from '@/utils/formatters';

type HistoryFilter = 'all' | 'delivered' | 'cancelled';

export default function DriverHistoryScreen() {
  const router = useRouter();
  const jobsState = useDriverJobs('mine');
  const issuesState = useDriverIssues();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const history = useMemo(
    () => jobsState.jobs.filter((job) => ['delivered', 'cancelled'].includes(job.status)),
    [jobsState.jobs],
  );
  const visibleHistory = useMemo(
    () => (filter === 'all' ? history : history.filter((job) => job.status === filter)),
    [filter, history],
  );
  const deliveredJobs = history.filter((job) => job.status === 'delivered');
  const totalEarnings = deliveredJobs.reduce((total, job) => total + job.payoutAmount, 0);
  const refresh = () => {
    jobsState.refresh();
    issuesState.refresh();
  };

  if (jobsState.isLoading && jobsState.jobs.length === 0) {
    return <DriverDataState isLoading />;
  }
  if (jobsState.error && jobsState.jobs.length === 0) {
    return <DriverDataState error={jobsState.error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={refresh}
            refreshing={jobsState.isLoading || issuesState.isLoading}
          />
        }>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Delivery History</Text>
            <Text style={styles.subtitle}>Completed trips and reported issues</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/driver/earnings' as Href)}
            style={styles.earningsButton}>
            <Text style={styles.earningsButtonText}>Earnings</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Summary label="TOTAL TRIPS" value={String(history.length)} />
          <Summary label="DELIVERED" value={String(deliveredJobs.length)} />
          <Summary label="TOTAL EARNED" value={formatLkr(totalEarnings)} compact />
        </View>

        <View style={styles.filters}>
          <Filter active={filter === 'all'} label="All" onPress={() => setFilter('all')} />
          <Filter active={filter === 'delivered'} label="Completed" onPress={() => setFilter('delivered')} />
          <Filter active={filter === 'cancelled'} label="Cancelled" onPress={() => setFilter('cancelled')} />
        </View>

        <Text style={styles.sectionTitle}>Recent Deliveries</Text>
        {visibleHistory.length > 0 ? (
          visibleHistory.map((job) => (
            <HistoryCard
              job={job}
              key={job._id}
              onReport={() => router.push(`/driver/issues/new?jobId=${job._id}` as Href)}
            />
          ))
        ) : (
          <DriverDataState emptyMessage="No deliveries match this history filter." />
        )}

        <View style={styles.issueHeader}>
          <Text style={styles.sectionTitle}>Reported Issues</Text>
          <Text style={styles.issueCount}>{issuesState.issues.length}</Text>
        </View>
        {issuesState.error ? <Text style={styles.error}>{issuesState.error}</Text> : null}
        {issuesState.issues.slice(0, 3).map((issue) => {
          const job = typeof issue.job === 'string' ? null : issue.job;
          return (
            <View key={issue._id} style={styles.issueCard}>
              <View style={styles.issueTitleRow}>
                <Text style={styles.issueType}>{formatLabel(issue.issueType)}</Text>
                <View style={[styles.issueStatus, issue.status === 'resolved' && styles.resolvedStatus]}>
                  <Text style={[styles.issueStatusText, issue.status === 'resolved' && styles.resolvedStatusText]}>
                    {formatLabel(issue.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.issueJob}>{job?.jobCode ?? 'Delivery job'}</Text>
              <Text numberOfLines={2} style={styles.issueDescription}>{issue.description}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ compact, label, value }: { compact?: boolean; label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text numberOfLines={1} style={[styles.summaryValue, compact && styles.compactSummary]}>{value}</Text>
    </View>
  );
}

function Filter({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && styles.activeFilter]}>
      <Text style={[styles.filterText, active && styles.activeFilterText]}>{label}</Text>
    </Pressable>
  );
}

function HistoryCard({ job, onReport }: { job: DeliveryJob; onReport: () => void }) {
  const completedAt = job.deliveredAt ?? job.updatedAt;
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{new Date(completedAt).toLocaleDateString('en-LK')}</Text>
        <View style={[styles.statusBadge, job.status === 'cancelled' && styles.cancelledBadge]}>
          <Text style={[styles.statusText, job.status === 'cancelled' && styles.cancelledText]}>{job.status}</Text>
        </View>
      </View>
      <Text style={styles.route}>{job.pickupPoints[0]?.city ?? 'Farm'} → {job.destination.city}</Text>
      <Text style={styles.cargo}>{job.totalWeightKg.toLocaleString('en-LK')} kg · {job.cargoDescription}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.payout}>{job.status === 'delivered' ? formatLkr(job.payoutAmount) : 'No payout'}</Text>
        <Pressable accessibilityRole="button" onPress={onReport}>
          <Text style={styles.reportText}>Report Issue</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 35 },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#969996', fontSize: 11, marginTop: 3 },
  earningsButton: { backgroundColor: BrandColors.primarySoft, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 9 },
  earningsButtonText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  summaryCard: { backgroundColor: BrandColors.primarySoft, borderRadius: 14, flexDirection: 'row', marginTop: 18, padding: 14 },
  summaryItem: { flex: 1 },
  summaryLabel: { color: BrandColors.primary, fontSize: 8, fontWeight: '800' },
  summaryValue: { color: '#3E413E', fontSize: 18, fontWeight: '800', marginTop: 6 },
  compactSummary: { fontSize: 12 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 16 },
  filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 8 },
  activeFilter: { backgroundColor: BrandColors.primary },
  filterText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  activeFilterText: { color: BrandColors.white },
  sectionTitle: { color: '#444744', fontSize: 13, fontWeight: '800', marginTop: 20 },
  historyCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginTop: 11, padding: 14 },
  historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  historyDate: { color: '#999C99', fontSize: 10 },
  statusBadge: { backgroundColor: BrandColors.primarySoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 },
  cancelledBadge: { backgroundColor: '#FEE2E2' },
  statusText: { color: BrandColors.primary, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  cancelledText: { color: BrandColors.danger },
  route: { color: '#3F423F', fontSize: 13, fontWeight: '800', marginTop: 10 },
  cargo: { color: '#909390', fontSize: 10, marginTop: 5 },
  cardFooter: { borderTopColor: BrandColors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, paddingTop: 10 },
  payout: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' },
  reportText: { color: BrandColors.warning, fontSize: 10, fontWeight: '800' },
  issueHeader: { alignItems: 'baseline', flexDirection: 'row', gap: 7 },
  issueCount: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  issueCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, marginTop: 10, padding: 13 },
  issueTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  issueType: { color: '#444744', fontSize: 12, fontWeight: '800' },
  issueStatus: { backgroundColor: '#FFF3CD', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  resolvedStatus: { backgroundColor: BrandColors.primarySoft },
  issueStatusText: { color: '#996C00', fontSize: 8, fontWeight: '800' },
  resolvedStatusText: { color: BrandColors.primary },
  issueJob: { color: BrandColors.primary, fontSize: 9, marginTop: 5 },
  issueDescription: { color: '#858885', fontSize: 10, lineHeight: 15, marginTop: 5 },
  error: { color: BrandColors.danger, fontSize: 10, marginTop: 8 },
});
