import { useDeferredValue, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { ProductCard } from '@/components/buyer/product-card';
import { BrandColors } from '@/constants/theme';
import { useMarketplaceProducts } from '@/hooks/use-marketplace-products';
import type {
  ListingType,
  MarketplaceFilters,
  PricingMode,
  ProductCategory,
  ProductSort,
} from '@/types/marketplace';

const categories: { label: string; value: ProductCategory }[] = [
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Fruits', value: 'fruits' },
  { label: 'Grains', value: 'grains' },
  { label: 'Spices', value: 'spices' },
  { label: 'Herbs', value: 'herbs' },
  { label: 'Coconut', value: 'coconut' },
];

const sortLabels: Record<ProductSort, string> = {
  newest: 'Newest First',
  priceAsc: 'Price: Low to High',
  priceDesc: 'Price: High to Low',
};

export default function BuyerSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const initialCategory = categories.some((item) => item.value === params.category)
    ? (params.category as ProductCategory)
    : undefined;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ProductCategory | undefined>(initialCategory);
  const [listingType, setListingType] = useState<ListingType | undefined>();
  const [pricingMode, setPricingMode] = useState<PricingMode | undefined>();
  const [sort, setSort] = useState<ProductSort>('newest');
  const deferredQuery = useDeferredValue(query);
  const filters = useMemo<MarketplaceFilters>(
    () => ({
      q: deferredQuery.trim() || undefined,
      category,
      listingType,
      pricingMode,
      sort,
      limit: 30,
    }),
    [category, deferredQuery, listingType, pricingMode, sort],
  );
  const { error, isLoading, products, refresh, total } = useMarketplaceProducts(filters, 300);

  const cycleSort = () => {
    setSort((current) => {
      if (current === 'newest') return 'priceAsc';
      if (current === 'priceAsc') return 'priceDesc';
      return 'newest';
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={products}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(product) => product._id}
        ListEmptyComponent={
          <MarketplaceState error={error} isLoading={isLoading} onRetry={refresh} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setQuery}
                placeholder="Search fresh produce…"
                placeholderTextColor="#9A9D9A"
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
              {query ? (
                <Pressable accessibilityRole="button" onPress={() => setQuery('')}>
                  <Text style={styles.clearIcon}>×</Text>
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              contentContainerStyle={styles.chipRow}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <FilterChip
                active={!category}
                label="All Products"
                onPress={() => setCategory(undefined)}
              />
              {categories.map((item) => (
                <FilterChip
                  active={category === item.value}
                  key={item.value}
                  label={item.label}
                  onPress={() => setCategory(item.value)}
                />
              ))}
            </ScrollView>

            <ScrollView
              contentContainerStyle={styles.secondaryChipRow}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <FilterChip
                active={!listingType}
                label="Any Harvest"
                onPress={() => setListingType(undefined)}
              />
              <FilterChip
                active={listingType === 'current'}
                label="Available Now"
                onPress={() => setListingType('current')}
              />
              <FilterChip
                active={listingType === 'future'}
                label="Future Harvests"
                onPress={() => setListingType('future')}
              />
              <FilterChip
                active={pricingMode === 'fixedPrice'}
                label="Fixed Price"
                onPress={() =>
                  setPricingMode((current) =>
                    current === 'fixedPrice' ? undefined : 'fixedPrice',
                  )
                }
              />
              <FilterChip
                active={pricingMode === 'bidding'}
                label="Bidding"
                onPress={() =>
                  setPricingMode((current) => (current === 'bidding' ? undefined : 'bidding'))
                }
              />
            </ScrollView>

            <View style={styles.resultsRow}>
              <Text style={styles.resultCount}>
                {isLoading ? 'Finding products…' : `${total} product${total === 1 ? '' : 's'}`}
              </Text>
              <Pressable accessibilityRole="button" onPress={cycleSort}>
                <Text style={styles.sortText}>{sortLabels[sort]}⌄</Text>
              </Pressable>
            </View>
          </View>
        }
        onRefresh={refresh}
        refreshing={isLoading && products.length > 0}
        renderItem={({ item }) => (
          <ProductCard
            onPress={() =>
              router.push({
                pathname: '/(app)/buyer/search/[productId]',
                params: { productId: item._id },
              })
            }
            product={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

type FilterChipProps = {
  active: boolean;
  label: string;
  onPress: () => void;
};

function FilterChip({ active, label, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, active && styles.activeChip]}>
      <Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: '#F4F7F4',
    borderRadius: 24,
    flexDirection: 'row',
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  searchIcon: {
    color: '#898C89',
    fontSize: 25,
  },
  searchInput: {
    color: '#414341',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
  },
  clearIcon: {
    color: '#8D908D',
    fontSize: 24,
  },
  chipRow: {
    gap: 8,
    paddingTop: 13,
  },
  secondaryChipRow: {
    gap: 8,
    paddingTop: 9,
  },
  chip: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  activeChip: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  chipText: {
    color: '#5D605D',
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: BrandColors.white,
    fontWeight: '800',
  },
  resultsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingTop: 16,
  },
  resultCount: {
    color: '#969996',
    fontSize: 12,
  },
  sortText: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  separator: {
    height: 11,
  },
});
