import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvisoryState } from '@/components/advisory/advisory-state';
import { RequestCard } from '@/components/advisory/request-card';
import { BrandColors } from '@/constants/theme';
import { useAssistanceRequests } from '@/hooks/use-assistance-requests';
import type { AssistanceRequestStatus } from '@/types/advisory';

type RequestFilter = 'all' | 'pending' | 'inReview' | 'resolved';

export default function OfficerRequestsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<RequestFilter>('all');
  const [search, setSearch] = useState('');
  const serverStatus: AssistanceRequestStatus | undefined = filter === 'pending' || filter === 'inReview' ? filter : undefined;
  const state = useAssistanceRequests(serverStatus);
  const requests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return state.requests.filter((item) => {
      const resolvedMatch = filter !== 'resolved' || ['approved', 'rejected', 'resolved'].includes(item.status);
      const searchMatch = !term || `${item.farmer.name} ${item.title} ${item.farmLocation.district}`.toLowerCase().includes(term);
      return resolvedMatch && searchMatch;
    });
  }, [filter, search, state.requests]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={requests}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<AdvisoryState emptyMessage="No farmer requests match this filter." error={state.error} isLoading={state.isLoading} onRetry={state.refresh} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Farmer Requests</Text>
            <Text style={styles.subtitle}>Review and respond to farmer applications</Text>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput onChangeText={setSearch} placeholder="Search by farmer name or request..." placeholderTextColor="#A3A6A3" style={styles.searchInput} value={search} />
            </View>
            <View style={styles.filters}>
              {(['all', 'pending', 'inReview', 'resolved'] as RequestFilter[]).map((item) => (
                <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
                  <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{filterLabel(item)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        onRefresh={state.refresh}
        refreshing={state.isLoading && state.requests.length > 0}
        renderItem={({ item }) => <RequestCard onPress={() => router.push(`/(app)/officer/requests/${item._id}` as Href)} request={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function filterLabel(filter: RequestFilter) {
  return { all: 'All', pending: 'Pending', inReview: 'In Review', resolved: 'Resolved' }[filter];
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#999C99', fontSize: 10, marginTop: 4 },
  searchBox: { alignItems: 'center', backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', marginTop: 17, paddingHorizontal: 12 },
  searchIcon: { color: '#969996', fontSize: 20 },
  searchInput: { color: '#454845', flex: 1, fontSize: 12, minHeight: 43, paddingHorizontal: 7 },
  filters: { flexDirection: 'row', gap: 7, marginVertical: 13 },
  filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 9 },
  activeFilter: { backgroundColor: BrandColors.primary },
  filterText: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' },
  activeFilterText: { color: BrandColors.white },
  separator: { height: 11 },
});
