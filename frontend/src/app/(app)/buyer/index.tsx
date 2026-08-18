import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { ProductCard } from '@/components/buyer/product-card';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useMarketplaceProducts } from '@/hooks/use-marketplace-products';
import type { ProductCategory } from '@/types/marketplace';

const categories: { label: string; symbol: string; value: ProductCategory }[] = [
  { label: 'Vegetables', symbol: '🥕', value: 'vegetables' },
  { label: 'Fruits', symbol: '🥭', value: 'fruits' },
  { label: 'Grains', symbol: '🌾', value: 'grains' },
  { label: 'Spices', symbol: '🌿', value: 'spices' },
];

export default function BuyerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { error, isLoading, products, refresh } = useMarketplaceProducts({ limit: 6 });
  const firstName = user?.name.split(' ')[0] ?? 'Buyer';

  const openSearch = (category?: ProductCategory) => {
    router.push({
      pathname: '/(app)/buyer/search',
      params: category ? { category } : undefined,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingCaption}>Ayubowan, Good Morning 👋</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <View style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>♧</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => openSearch()} style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchPlaceholder}>Search fresh harvests, spices, tea…</Text>
          <Text style={styles.filterIcon}>☷</Text>
        </Pressable>

        <View style={styles.promoCard}>
          <View style={styles.promoCopy}>
            <View style={styles.seasonBadge}>
              <Text style={styles.seasonBadgeText}>HARVEST SEASON</Text>
            </View>
            <Text style={styles.promoTitle}>Fresh produce from Sri Lankan farms</Text>
            <Text style={styles.promoDescription}>Buy directly from farmers and cooperatives</Text>
          </View>
          <Text style={styles.promoSymbol}>🌾</Text>
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categories}>
          {categories.map((category) => (
            <Pressable
              accessibilityRole="button"
              key={category.value}
              onPress={() => openSearch(category.value)}
              style={styles.categoryCard}>
              <Text style={styles.categorySymbol}>{category.symbol}</Text>
              <Text numberOfLines={1} style={styles.categoryLabel}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Fresh from farms</Text>
          <Pressable accessibilityRole="button" onPress={() => openSearch()}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {isLoading || error || products.length === 0 ? (
          <MarketplaceState error={error} isLoading={isLoading} onRetry={refresh} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.productRow}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {products.map((product) => (
              <ProductCard
                compact
                key={product._id}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/buyer/search/[productId]',
                    params: { productId: product._id },
                  })
                }
                product={product}
              />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  content: {
    paddingBottom: 26,
    paddingHorizontal: 20,
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 13,
    paddingTop: 12,
  },
  greetingCaption: {
    color: '#929592',
    fontSize: 13,
  },
  greetingName: {
    color: '#444644',
    fontSize: 21,
    fontWeight: '800',
    marginTop: 2,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  notificationIcon: {
    color: BrandColors.primary,
    fontSize: 23,
    fontWeight: '800',
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderColor: BrandColors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: 13,
  },
  searchIcon: {
    color: '#898C89',
    fontSize: 25,
  },
  searchPlaceholder: {
    color: '#A0A3A0',
    flex: 1,
    fontSize: 13,
    marginHorizontal: 8,
  },
  filterIcon: {
    color: BrandColors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  promoCard: {
    alignItems: 'center',
    backgroundColor: '#E7F6ED',
    borderRadius: 17,
    flexDirection: 'row',
    marginTop: 17,
    minHeight: 130,
    overflow: 'hidden',
    padding: 17,
  },
  promoCopy: {
    flex: 1,
  },
  seasonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primary,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  seasonBadgeText: {
    color: BrandColors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  promoTitle: {
    color: '#3E403E',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
    marginTop: 8,
  },
  promoDescription: {
    color: '#747774',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  promoSymbol: {
    fontSize: 58,
    marginLeft: 10,
  },
  sectionTitle: {
    color: '#4A4C4A',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 22,
  },
  categories: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 10,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  categorySymbol: {
    fontSize: 25,
  },
  categoryLabel: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionHeadingRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seeAll: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  productRow: {
    gap: 12,
    paddingBottom: 6,
    paddingTop: 11,
  },
});
