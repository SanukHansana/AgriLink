import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { ProductImage } from '@/components/buyer/product-image';
import { BrandColors } from '@/constants/theme';
import { useMarketplaceProduct } from '@/hooks/use-marketplace-product';
import {
  formatLkr,
  formatProductUnit,
  getProductPrice,
  getSellerName,
} from '@/utils/formatters';

export default function BuyerProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const { error, isLoading, product, refresh } = useMarketplaceProduct(productId);
  const [quantity, setQuantity] = useState(0);

  if (isLoading || error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Product Details</Text>
          <View style={styles.topBarSpacer} />
        </View>
        <MarketplaceState
          error={error}
          isLoading={isLoading}
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  const price = getProductPrice(product);
  const supportsFixedPrice = product.pricingMode !== 'bidding';
  const supportsBidding = product.pricingMode !== 'fixedPrice';
  const selectedQuantity = quantity || product.minimumOrderQuantity;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.topBarTitle}>Product Details</Text>
          <Text style={styles.shareIcon}>⇧</Text>
        </View>

        <ProductImage product={product} style={styles.heroImage} />

        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>
              {price === undefined ? 'Bidding available' : formatLkr(price)}
              {price === undefined ? '' : (
                <Text style={styles.priceUnit}>/{formatProductUnit(product.unit)}</Text>
              )}
            </Text>
          </View>
          <View style={styles.listingBadge}>
            <Text style={styles.listingBadgeText}>
              {product.listingType === 'future' ? 'Future harvest' : 'Available now'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sellerCard}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerAvatarText}>{getSellerName(product).charAt(0)}</Text>
          </View>
          <View style={styles.sellerCopy}>
            <Text style={styles.sellerName}>{getSellerName(product)}</Text>
            <Text style={styles.sellerLocation}>
              {product.farmLocation.city ? `${product.farmLocation.city}, ` : ''}
              {product.farmLocation.district}, Sri Lanka
            </Text>
          </View>
          <Text style={styles.verified}>✓</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>AVAILABLE QUANTITY</Text>
            <Text style={styles.detailValue}>
              {product.availableQuantity.toLocaleString('en-LK')} {product.unit}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>MINIMUM ORDER</Text>
            <Text style={styles.detailValue}>
              {product.minimumOrderQuantity.toLocaleString('en-LK')} {product.unit}
            </Text>
          </View>
          {product.qualityGrade ? (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>QUALITY</Text>
              <Text style={styles.detailValue}>{product.qualityGrade}</Text>
            </View>
          ) : null}
          {product.harvestDate ? (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>HARVEST DATE</Text>
              <Text style={styles.detailValue}>
                {new Date(product.harvestDate).toLocaleDateString('en-LK')}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.description}>
          {product.description ||
            'Fresh Sri Lankan produce supplied directly by a registered AgriLink farmer.'}
        </Text>

        {supportsFixedPrice ? (
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControl}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setQuantity(Math.max(product.minimumOrderQuantity, selectedQuantity - 1))
                }
                style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>−</Text>
              </Pressable>
              <Text style={styles.quantityValue}>
                {selectedQuantity.toLocaleString('en-LK')} {product.unit}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setQuantity(Math.min(product.availableQuantity, selectedQuantity + 1))
                }
                style={styles.quantityButton}>
                <Text style={styles.quantityButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {supportsFixedPrice ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/(app)/buyer/checkout/[productId]',
                  params: { productId, quantity: String(selectedQuantity) },
                })
              }
              style={[styles.actionButton, styles.softButton]}>
              <Text style={styles.softButtonText}>Fixed Price Buy</Text>
            </Pressable>
          ) : null}
          {supportsBidding ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/(app)/buyer/bid/[productId]',
                  params: { productId },
                })
              }
              style={[styles.actionButton, styles.outlineButton]}>
              <Text style={styles.outlineButtonText}>Place a Bid</Text>
            </Pressable>
          ) : null}
        </View>
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
    paddingBottom: 28,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: 16,
  },
  backIcon: {
    color: '#555855',
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 40,
  },
  topBarTitle: {
    color: '#4D504D',
    fontSize: 17,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 24,
  },
  shareIcon: {
    color: '#555855',
    fontSize: 24,
  },
  heroImage: {
    borderRadius: 17,
    height: 220,
    marginHorizontal: 16,
    width: 'auto',
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 17,
  },
  titleCopy: {
    flex: 1,
  },
  productName: {
    color: '#505350',
    fontSize: 23,
    fontWeight: '800',
  },
  price: {
    color: BrandColors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 5,
  },
  priceUnit: {
    color: '#979A97',
    fontSize: 13,
    fontWeight: '500',
  },
  listingBadge: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 10,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  listingBadgeText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    backgroundColor: BrandColors.border,
    height: 1,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  sellerCard: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sellerAvatarText: {
    color: BrandColors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  sellerCopy: {
    flex: 1,
    gap: 3,
    marginLeft: 10,
  },
  sellerName: {
    color: '#4D504D',
    fontSize: 14,
    fontWeight: '800',
  },
  sellerLocation: {
    color: '#969996',
    fontSize: 12,
  },
  verified: {
    color: BrandColors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 18,
    rowGap: 16,
  },
  detailItem: {
    width: '50%',
  },
  detailLabel: {
    color: '#A0A3A0',
    fontSize: 10,
  },
  detailValue: {
    color: '#4D504D',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  description: {
    color: '#8D908D',
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quantityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quantityLabel: {
    color: '#4D504D',
    fontSize: 14,
    fontWeight: '800',
  },
  quantityControl: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 42,
  },
  quantityButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
  },
  quantityButtonText: {
    color: '#555855',
    fontSize: 20,
    fontWeight: '700',
  },
  quantityValue: {
    color: '#555855',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 82,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  softButton: {
    backgroundColor: BrandColors.primarySoft,
  },
  softButtonText: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  outlineButton: {
    borderColor: BrandColors.primary,
    borderWidth: 1,
  },
  outlineButtonText: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
