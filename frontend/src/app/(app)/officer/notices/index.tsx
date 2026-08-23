import { useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdvisoryState } from '@/components/advisory/advisory-state';
import { BrandColors } from '@/constants/theme';
import { useAdvisoryNotices } from '@/hooks/use-advisory-notices';
import { getApiErrorMessage } from '@/services/api';
import { archiveNotice, publishNotice } from '@/services/advisory-service';
import type { AdvisoryNotice } from '@/types/advisory';

type NoticeFilter = 'all' | AdvisoryNotice['status'];

export default function OfficerNoticesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<NoticeFilter>('all');
  const state = useAdvisoryNotices(filter === 'all' ? undefined : filter);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (notice: AdvisoryNotice) => {
    setBusyId(notice._id);
    setActionError(null);
    try {
      const changed = notice.status === 'draft' ? await publishNotice(notice._id) : await archiveNotice(notice._id);
      state.setNotices((current) => current.map((item) => item._id === changed._id ? changed : item));
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={state.refresh} refreshing={state.isLoading} />} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View><Text style={styles.title}>Advisory Notices</Text><Text style={styles.subtitle}>Publish updates and guidance to farmers</Text></View><Pressable onPress={() => router.push('/(app)/officer/notices/new' as Href)} style={styles.addButton}><Text style={styles.addText}>＋</Text></Pressable></View>

        <View style={styles.tools}>
          <Pressable onPress={() => router.push('/(app)/officer/notices/surplus' as Href)} style={styles.tool}><Text style={styles.toolIcon}>↘</Text><Text style={styles.toolTitle}>Market Surplus</Text><Text style={styles.toolText}>Issue crop surplus advice</Text></Pressable>
          <Pressable onPress={() => router.push('/(app)/officer/notices/quality' as Href)} style={styles.tool}><Text style={styles.toolIcon}>✓</Text><Text style={styles.toolTitle}>Quality Standards</Text><Text style={styles.toolText}>Manage crop guidelines</Text></Pressable>
        </View>

        <View style={styles.filters}>{(['all', 'draft', 'published', 'archived'] as NoticeFilter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}><Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{capitalize(item)}</Text></Pressable>)}</View>
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        {state.notices.length > 0 ? state.notices.map((notice) => <View key={notice._id} style={[styles.noticeCard, notice.isEmergency && styles.emergencyCard]}><View style={styles.noticeHeader}><View style={styles.typeBadge}><Text style={styles.typeText}>{notice.type.replace(/([A-Z])/g, ' $1')}</Text></View><Text style={styles.status}>{capitalize(notice.status)}</Text></View><Text style={styles.noticeTitle}>{notice.title}</Text><Text numberOfLines={3} style={styles.description}>{notice.description}</Text><Text style={styles.meta}>{notice.targetAudience === 'allFarmers' ? 'All Farmers' : notice.targetDistrict} · {notice.languages.map((item) => item.toUpperCase()).join(', ')}</Text>{notice.status !== 'archived' ? <Pressable disabled={busyId === notice._id} onPress={() => runAction(notice)} style={styles.action}><Text style={styles.actionText}>{busyId === notice._id ? 'Updating...' : notice.status === 'draft' ? 'Publish Notice' : 'Archive Notice'}</Text></Pressable> : null}</View>) : <AdvisoryState emptyMessage="Create your first notice to inform farmers." error={state.error} isLoading={state.isLoading} onRetry={state.refresh} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({ safeArea: { backgroundColor: '#FAFCFA', flex: 1 }, content: { padding: 16, paddingBottom: 34 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800' }, subtitle: { color: '#999C99', fontSize: 10, marginTop: 3 }, addButton: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, addText: { color: BrandColors.primary, fontSize: 22, fontWeight: '800' }, tools: { flexDirection: 'row', gap: 10, marginTop: 18 }, tool: { backgroundColor: BrandColors.primarySoft, borderRadius: 13, flex: 1, padding: 13 }, toolIcon: { color: BrandColors.primary, fontSize: 20, fontWeight: '800' }, toolTitle: { color: BrandColors.primary, fontSize: 11, fontWeight: '800', marginTop: 8 }, toolText: { color: '#748474', fontSize: 8, marginTop: 3 }, filters: { flexDirection: 'row', gap: 7, marginVertical: 16 }, filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }, activeFilter: { backgroundColor: BrandColors.primary }, filterText: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' }, activeFilterText: { color: BrandColors.white }, error: { color: BrandColors.danger, fontSize: 10, marginBottom: 9, textAlign: 'center' }, noticeCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginBottom: 11, padding: 14 }, emergencyCard: { borderColor: BrandColors.warning }, noticeHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, typeBadge: { backgroundColor: BrandColors.primarySoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, typeText: { color: BrandColors.primary, fontSize: 8, fontWeight: '800', textTransform: 'capitalize' }, status: { color: '#888B88', fontSize: 9, fontWeight: '700' }, noticeTitle: { color: '#444744', fontSize: 14, fontWeight: '800', marginTop: 11 }, description: { color: '#686B68', fontSize: 10, lineHeight: 15, marginTop: 6 }, meta: { color: '#999C99', fontSize: 8, marginTop: 10 }, action: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 9, marginTop: 11, paddingVertical: 10 }, actionText: { color: BrandColors.white, fontSize: 9, fontWeight: '800' } });
