import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProductImage } from '@/components/buyer/product-image';
import { BrandColors } from '@/constants/theme';
import type { MarketplaceProduct } from '@/types/marketplace';
import { formatLkr } from '@/utils/formatters';

export function FarmerProductTile({ product, onPress }: { product: MarketplaceProduct; onPress: () => void }) {
  const price = product.fixedPrice ?? product.minimumBidPrice;
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <ProductImage product={product} style={styles.image} />
      <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{price ? formatLkr(price) : 'Price not set'} <Text style={styles.unit}>/{product.unit}</Text></Text>
      <Text style={styles.stock}>Stock: {product.availableQuantity.toLocaleString('en-LK')} {product.unit}</Text>
      <View style={[styles.badge, product.status === 'pending' && styles.pending, product.status === 'sold' && styles.sold]}>
        <Text style={[styles.badgeText, product.status === 'pending' && styles.pendingText, product.status === 'sold' && styles.soldText]}>{product.status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, padding: 10, width: '48.5%' },
  image: { borderRadius: 10, height: 100, width: '100%' },
  name: { color: '#505350', fontSize: 12, fontWeight: '800', marginTop: 8 },
  price: { color: BrandColors.primary, fontSize: 12, fontWeight: '800', marginTop: 5 },
  unit: { color: '#979A97', fontSize: 9, fontWeight: '400' },
  stock: { color: '#999C99', fontSize: 9, marginTop: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: BrandColors.primarySoft, borderRadius: 7, marginTop: 7, paddingHorizontal: 8, paddingVertical: 5 },
  pending: { backgroundColor: '#FFF3CD' },
  sold: { backgroundColor: '#ECEEEC' },
  badgeText: { color: BrandColors.primary, fontSize: 8, fontWeight: '800', textTransform: 'capitalize' },
  pendingText: { color: BrandColors.warning },
  soldText: { color: '#696C69' },
});
