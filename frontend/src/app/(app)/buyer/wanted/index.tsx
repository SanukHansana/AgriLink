import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuyerDataState } from '@/components/buyer/buyer-data-state';
import { BrandColors } from '@/constants/theme';
import { usePurchaseRequests } from '@/hooks/use-purchase-requests';
import type { PurchaseRequestStatus } from '@/types/purchase-request';

type Filter = 'all' | PurchaseRequestStatus;

export default function WantedProductsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { error, isLoading, purchaseRequests, refresh } = usePurchaseRequests(filter === 'all' ? undefined : filter);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  if (isLoading && purchaseRequests.length === 0) return <BuyerDataState isLoading />;
  if (error && purchaseRequests.length === 0) return <BuyerDataState error={error} onRetry={refresh} />;

  return <SafeAreaView edges={['top']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} />}><View style={styles.header}><View><Text style={styles.brand}>AgriLink</Text><Text style={styles.title}>Wanted Products</Text></View><Pressable accessibilityLabel="Add wanted product" onPress={() => router.push('/buyer/wanted/new' as Href)} style={styles.addButton}><Text style={styles.addText}>+</Text></Pressable></View><Text style={styles.intro}>Post what you need and manage your buying requirements.</Text><View style={styles.filters}>{(['all', 'open', 'fulfilled'] as Filter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}><Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{capitalize(item)}</Text></Pressable>)}</View>{purchaseRequests.length ? <View style={styles.list}>{purchaseRequests.map((item) => <Pressable key={item._id} onPress={() => router.push(`/buyer/wanted/${item._id}` as Href)} style={styles.card}><View style={styles.cardTop}><View style={styles.categoryBadge}><Text style={styles.categoryText}>{capitalize(item.category)}</Text></View><Text style={[styles.status, item.status === 'fulfilled' && styles.fulfilled]}>{capitalize(item.status)}</Text></View><Text style={styles.productName}>{item.productName}</Text><Text style={styles.quantity}>{item.quantity} {item.unit} at up to LKR {item.maximumUnitPrice.toLocaleString()} / {item.unit}</Text><View style={styles.meta}><Text style={styles.metaText}>Needed {new Date(item.requiredBy).toLocaleDateString()}</Text><Text style={styles.metaText}>{item.deliveryLocation.district}</Text></View></Pressable>)}</View> : <BuyerDataState emptyMessage="No wanted products in this view." />}</ScrollView></SafeAreaView>;
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }

const styles = StyleSheet.create({ safeArea: { backgroundColor: '#FAFCFA', flex: 1 }, content: { padding: 16, paddingBottom: 32 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, brand: { color: BrandColors.primary, fontSize: 27, fontWeight: '800' }, title: { color: '#454845', fontSize: 17, fontWeight: '800', marginTop: -2 }, addButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 8, height: 44, justifyContent: 'center', width: 44 }, addText: { color: BrandColors.white, fontSize: 28, lineHeight: 30 }, intro: { color: '#858885', fontSize: 12, lineHeight: 18, marginTop: 12 }, filters: { flexDirection: 'row', gap: 8, marginVertical: 16 }, filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 8 }, activeFilter: { backgroundColor: BrandColors.primary }, filterText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' }, activeFilterText: { color: BrandColors.white }, list: { gap: 10 }, card: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 8, borderWidth: 1, padding: 14 }, cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, categoryBadge: { backgroundColor: BrandColors.primarySoft, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4 }, categoryText: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' }, status: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' }, fulfilled: { color: '#777A77' }, productName: { color: '#3F423F', fontSize: 17, fontWeight: '800', marginTop: 10 }, quantity: { color: '#606360', fontSize: 12, marginTop: 5 }, meta: { borderTopColor: BrandColors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10 }, metaText: { color: '#8A8D8A', fontSize: 10, fontWeight: '600' } });
