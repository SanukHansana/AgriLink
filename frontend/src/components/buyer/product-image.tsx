import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { MarketplaceProduct } from '@/types/marketplace';

const categorySymbols: Record<MarketplaceProduct['category'], string> = {
  vegetables: '🥬',
  fruits: '🥭',
  grains: '🌾',
  spices: '🌿',
  herbs: '🍃',
  coconut: '🥥',
  other: '🌱',
};

type ProductImageProps = {
  product: MarketplaceProduct;
  style?: StyleProp<ImageStyle>;
};

export function ProductImage({ product, style }: ProductImageProps) {
  const imageUrl = product.images?.[0];

  if (imageUrl) {
    return (
      <Image
        accessibilityLabel={product.name}
        contentFit="cover"
        source={{ uri: imageUrl }}
        style={[styles.image, style]}
        transition={180}
      />
    );
  }

  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.symbol}>{categorySymbols[product.category]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: BrandColors.primarySurface,
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySurface,
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 38,
  },
});
