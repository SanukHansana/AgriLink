import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeliveryJobCard } from '@/components/driver/delivery-job-card';
import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverJobs } from '@/hooks/use-driver-jobs';

type JobFilter = 'all' | 'shared' | 'highPay';

export default function DriverAvailableJobsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<JobFilter>('all');
  const { error, isLoading, jobs, refresh } = useDriverJobs('available');
  const visibleJobs = useMemo(() => {
    const filtered = filter === 'shared' ? jobs.filter((job) => job.sharedDelivery) : [...jobs];
    if (filter === 'highPay') filtered.sort((a, b) => b.payoutAmount - a.payoutAmount);
    return filtered;
  }, [filter, jobs]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={visibleJobs}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(job) => job._id}
        ListEmptyComponent={
          <DriverDataState
            emptyMessage="No delivery jobs match this filter right now."
            error={error}
            isLoading={isLoading}
            onRetry={refresh}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Available Jobs</Text>
            <Text style={styles.subtitle}>{jobs.length} delivery trips ready for drivers</Text>
            <View style={styles.filters}>
              <Filter label={`All (${jobs.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Filter label="Shared Delivery" active={filter === 'shared'} onPress={() => setFilter('shared')} />
              <Filter label="High Pay" active={filter === 'highPay'} onPress={() => setFilter('highPay')} />
            </View>
          </View>
        }
        onRefresh={refresh}
        refreshing={isLoading && jobs.length > 0}
        renderItem={({ item }) => (
          <DeliveryJobCard
            job={item}
            onPress={() =>
              router.push(`/driver/jobs/${item._id}` as Href)
            }
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function Filter({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.filter, active && styles.activeFilter]}>
      <Text style={[styles.filterText, active && styles.activeFilterText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#969996', fontSize: 11, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 17, marginTop: 18 },
  filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  activeFilter: { backgroundColor: BrandColors.primary },
  filterText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  activeFilterText: { color: BrandColors.white },
  separator: { height: 12 },
});
