import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FarmerProductTile } from '@/components/farmer/product-tile';
import { FarmerState } from '@/components/farmer/farmer-state';
import { BrandColors } from '@/constants/theme';
import { useFarmerProducts } from '@/hooks/use-farmer-products';
import type { MarketplaceProduct } from '@/types/marketplace';

type StatusFilter = 'all' | MarketplaceProduct['status'];

export default function FarmerProductsScreen() {
  const router = useRouter();
  const { error, isLoading, products, refresh } = useFarmerProducts();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const visible = useMemo(() => filter === 'all' ? products : products.filter((item) => item.status === filter), [filter, products]);

  if (isLoading && products.length === 0) return <FarmerState isLoading />;
  if (error && products.length === 0) return <FarmerState error={error} onRetry={refresh} />;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} />}>
        <View style={styles.header}><View><Text style={styles.brand}>Farm</Text><Text style={styles.title}>My Products</Text></View><Pressable onPress={() => router.push('/farmer/products/new' as Href)} style={styles.addButton}><Text style={styles.addText}>+</Text></Pressable></View>
        <Pressable onPress={() => router.push('/farmer/products/future' as Href)} style={styles.harvestBanner}><View><Text style={styles.harvestTitle}>Future Harvest Schedule</Text><Text style={styles.harvestText}>Manage upcoming yields and pre-order listings</Text></View><Text style={styles.arrow}>›</Text></Pressable>
        <View style={styles.filters}>{(['all', 'active', 'pending', 'sold'] as StatusFilter[]).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}><Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}</Text></Pressable>)}</View>
        {visible.length > 0 ? <View style={styles.grid}>{visible.map((product) => <FarmerProductTile key={product._id} product={product} onPress={() => router.push(`/farmer/products/${product._id}` as Href)} />)}</View> : <FarmerState emptyMessage="No products match this filter." />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 }, content: { padding: 16, paddingBottom: 30 }, header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  brand: { color: BrandColors.primary, fontSize: 27, fontWeight: '800' }, title: { color: BrandColors.primary, fontSize: 16, fontWeight: '800', marginTop: -3 }, addButton: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, addText: { color: BrandColors.primary, fontSize: 28 },
  harvestBanner: { alignItems: 'center', backgroundColor: BrandColors.primarySurface, borderColor: BrandColors.primary, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, padding: 13 }, harvestTitle: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' }, harvestText: { color: '#8D908D', fontSize: 9, marginTop: 3 }, arrow: { color: BrandColors.primary, fontSize: 25 },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 14 }, filter: { backgroundColor: BrandColors.primarySoft, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 8 }, activeFilter: { backgroundColor: BrandColors.primary }, filterText: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' }, activeFilterText: { color: BrandColors.white }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
