import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverEarnings } from '@/hooks/use-driver-earnings';
import { formatLkr } from '@/utils/formatters';

export default function DriverEarningsScreen() {
  const router = useRouter();
  const { data, error, isLoading, refresh } = useDriverEarnings();

  if (isLoading && !data) return <DriverDataState isLoading />;
  if (error && !data) return <DriverDataState error={error} onRetry={refresh} />;
  if (!data) return <DriverDataState emptyMessage="No earnings information is available." />;

  const maxDay = Math.max(...data.weekly.map((day) => day.amount), 1);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} />}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View>
            <Text style={styles.title}>Earnings Dashboard</Text>
            <Text style={styles.subtitle}>Payouts from completed deliveries</Text>
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL COMPLETED-TRIP EARNINGS</Text>
          <Text style={styles.totalValue}>{formatLkr(data.summary.totalEarnings)}</Text>
          <View style={styles.totalDivider} />
          <Text style={styles.totalHint}>{data.summary.totalTrips} completed deliveries</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Last 7 Days</Text>
          <View style={styles.chart}>
            {data.weekly.map((day) => (
              <View key={day.date} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    { height: day.amount > 0 ? Math.max(8, (day.amount / maxDay) * 105) : 3 },
                  ]}
                />
                <Text style={styles.dayLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Metric label="TODAY'S PAYOUT" value={formatLkr(data.summary.todayEarnings)} />
          <Metric label="THIS MONTH" value={formatLkr(data.summary.monthEarnings)} />
        </View>

        <Text style={styles.sectionTitle}>Recent Completed Trips</Text>
        {data.transactions.length > 0 ? (
          data.transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionCard}>
              <View style={styles.transactionCopy}>
                <Text style={styles.transactionTitle}>{transaction.jobCode} · {transaction.destination.city}</Text>
                <Text numberOfLines={1} style={styles.transactionCargo}>{transaction.cargoDescription}</Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.deliveredAt ?? transaction.scheduledPickupAt).toLocaleString('en-LK')}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>+ {formatLkr(transaction.payoutAmount)}</Text>
            </View>
          ))
        ) : (
          <DriverDataState emptyMessage="Completed delivery payouts will appear here." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 35 },
  header: { alignItems: 'center', flexDirection: 'row', marginTop: 8 },
  back: { color: BrandColors.primary, fontSize: 36, lineHeight: 38, marginRight: 10 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#969996', fontSize: 11, marginTop: 3 },
  totalCard: { backgroundColor: BrandColors.primary, borderRadius: 15, marginTop: 18, padding: 18 },
  totalLabel: { color: '#B9E3C8', fontSize: 9, fontWeight: '800' },
  totalValue: { color: BrandColors.white, fontSize: 27, fontWeight: '800', marginTop: 9 },
  totalDivider: { backgroundColor: '#45A86A', height: 1, marginVertical: 15 },
  totalHint: { color: '#D8F0E1', fontSize: 10 },
  chartCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginTop: 16, padding: 15 },
  cardTitle: { color: '#434643', fontSize: 13, fontWeight: '800' },
  chart: { alignItems: 'flex-end', flexDirection: 'row', height: 140, justifyContent: 'space-between', marginTop: 8 },
  barColumn: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  bar: { backgroundColor: BrandColors.primary, borderRadius: 3, maxWidth: 22, width: '55%' },
  dayLabel: { color: '#979A97', fontSize: 8, marginTop: 7 },
  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metricCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 13 },
  metricLabel: { color: '#999C99', fontSize: 8, fontWeight: '800' },
  metricValue: { color: '#414441', fontSize: 13, fontWeight: '800', marginTop: 7 },
  sectionTitle: { color: '#414441', fontSize: 13, fontWeight: '800', marginTop: 20 },
  transactionCard: { alignItems: 'center', backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginTop: 10, padding: 13 },
  transactionCopy: { flex: 1, marginRight: 9 },
  transactionTitle: { color: '#444744', fontSize: 11, fontWeight: '800' },
  transactionCargo: { color: '#8D908D', fontSize: 9, marginTop: 4 },
  transactionDate: { color: '#A0A3A0', fontSize: 8, marginTop: 3 },
  transactionAmount: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
});
