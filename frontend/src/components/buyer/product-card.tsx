import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Pressable, Text } from '@/i18n/native';

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
  const { width, fontScale } = useWindowDimensions();
  const stacked = !compact && (width < 360 || fontScale >= 1.3);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : styles.listCard,
        stacked && styles.stackedCard,
        pressed && styles.pressed,
      ]}>
      <ProductImage
        product={product}
        style={compact ? styles.compactImage : stacked ? styles.stackedImage : styles.listImage}
      />

      <View style={[styles.copy, compact && styles.compactCopy]}>
        <View style={styles.titleRow}>
          <Text style={styles.name} localize={false}>
            {product.name}
          </Text>
          {product.listingType === 'future' ? (
            <View style={styles.futureBadge}>
              <Text style={styles.futureBadgeText}>Future</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.seller}>
          {getSellerName(product)} • {product.farmLocation.district}
        </Text>
        <Text style={styles.price}>
          {price === undefined ? 'Bidding only' : formatLkr(price)}
          {price === undefined ? '' : (
            <Text style={styles.unit}>/{formatProductUnit(product.unit)}</Text>
          )}
        </Text>
        <Text style={styles.availability}>{product.availableQuantity > 0 ? `${product.listingType === 'future' ? 'Expected' : 'Available'}: ${product.availableQuantity.toLocaleString('en-LK')} ${formatProductUnit(product.unit)}` : 'Out of stock'}</Text>
        {product.listingType === 'future' && product.harvestDate && <Text style={styles.availability}>Harvest: {new Date(product.harvestDate).toLocaleDateString('en-LK')}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
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
    padding: 14,
    gap: 14,
    alignItems: 'flex-start',
  },
  stackedCard: { flexDirection: 'column' },
  stackedImage: { width: '100%', height: 180, borderRadius: 12 },
  availability: { color: '#365840', fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  pressed: {
    opacity: 0.78,
  },
  compactImage: {
    height: 118,
    width: '100%',
  },
  listImage: {
    borderRadius: 12,
    height: 96,
    width: 96,
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    justifyContent: 'center',
  },
  compactCopy: {
    padding: 11,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    color: '#464846',
    flex: 1,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
  },
  seller: {
    color: '#526055',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 4,
  },
  price: {
    color: BrandColors.primary,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
    marginTop: 5,
  },
  unit: {
    color: '#526055',
    fontSize: 16,
    lineHeight: 23,
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
    fontSize: 14,
    fontWeight: '800',
  },
});
