import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/buyer/product-image';
import { BrandColors } from '@/constants/theme';
import type { MarketplaceProduct } from '@/types/marketplace';
import {
  formatLkr,
  formatProductUnit,
  getProductPrice,
  getSellerName,
} from '@/utils/formatters';

type ProductCardProps = {
  compact?: boolean;
  onPress: () => void;
  product: MarketplaceProduct;
};

export function ProductCard({ compact = false, onPress, product }: ProductCardProps) {
  const price = getProductPrice(product);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.listCard,
        pressed && styles.pressed,
      ]}>
      <ProductImage
        product={product}
        style={compact ? styles.compactImage : styles.listImage}
      />

      <View style={[styles.copy, compact && styles.compactCopy]}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>
            {product.name}
          </Text>
          {product.listingType === 'future' ? (
            <View style={styles.futureBadge}>
              <Text style={styles.futureBadgeText}>Future</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} style={styles.seller}>
          {getSellerName(product)} • {product.farmLocation.district}
        </Text>
        <Text style={styles.price}>
          {price === undefined ? 'Bidding only' : formatLkr(price)}
          {price === undefined ? '' : (
            <Text style={styles.unit}>/{formatProductUnit(product.unit)}</Text>
          )}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  compactCard: {
    width: 176,
  },
  listCard: {
    flexDirection: 'row',
    padding: 10,
  },
  pressed: {
    opacity: 0.78,
  },
  compactImage: {
    height: 118,
    width: '100%',
  },
  listImage: {
    borderRadius: 12,
    height: 94,
    width: 94,
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
  },
  compactCopy: {
    padding: 11,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  name: {
    color: '#464846',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  seller: {
    color: '#969996',
    fontSize: 12,
    marginTop: 4,
  },
  price: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  unit: {
    color: '#999C99',
    fontSize: 12,
    fontWeight: '500',
  },
  futureBadge: {
    backgroundColor: '#FFF2CF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  futureBadgeText: {
    color: BrandColors.warning,
    fontSize: 9,
    fontWeight: '800',
  },
});
