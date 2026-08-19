import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { ProductImage } from '@/components/buyer/product-image';
import { PrimaryButton } from '@/components/auth/primary-button';
import { BrandColors } from '@/constants/theme';
import { useMarketplaceProduct } from '@/hooks/use-marketplace-product';
import { getApiErrorMessage } from '@/services/api';
import { createBuyerBid } from '@/services/bid-service';
import { formatLkr, formatProductUnit, getSellerName } from '@/utils/formatters';

export default function PlaceBidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const { error: productError, isLoading, product, refresh } = useMarketplaceProduct(productId);
  const [bidAmount, setBidAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || productError || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MarketplaceState error={productError} isLoading={isLoading} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const numericBid = Number(bidAmount);
  const numericQuantity = Number(quantity);
  const estimatedTotal =
    Number.isFinite(numericBid) && Number.isFinite(numericQuantity)
      ? numericBid * numericQuantity
      : 0;

  const submitBid = async () => {
    setSubmitError(null);

    if (!(numericBid > 0) || !(numericQuantity > 0)) {
      setSubmitError('Enter a positive bid price and quantity.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createBuyerBid({
        productId,
        bidAmount: numericBid,
        quantity: numericQuantity,
      });
      router.replace('/(app)/buyer/orders');
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>
            <Text style={styles.topBarTitle}>Place Your Bid</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.productCard}>
            <ProductImage product={product} style={styles.productImage} />
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.seller}>Seller: {getSellerName(product)}</Text>
            </View>
          </View>

          <View style={styles.marketRow}>
            <View style={styles.marketCard}>
              <Text style={styles.marketLabel}>MINIMUM BID</Text>
              <Text style={styles.marketValue}>
                {product.minimumBidPrice
                  ? `${formatLkr(product.minimumBidPrice)}/${formatProductUnit(product.unit)}`
                  : 'Open bidding'}
              </Text>
            </View>
            <View style={[styles.marketCard, styles.availabilityCard]}>
              <Text style={styles.marketLabel}>AVAILABLE</Text>
              <Text style={styles.availabilityValue}>
                {product.availableQuantity.toLocaleString('en-LK')} {product.unit}
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>YOUR BID PRICE (LKR per {product.unit}) *</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setBidAmount}
            placeholder={product.minimumBidPrice ? String(product.minimumBidPrice) : '0'}
            placeholderTextColor="#9A9D9A"
            style={styles.input}
            value={bidAmount}
          />

          <Text style={styles.inputLabel}>QUANTITY TO ORDER ({product.unit}) *</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setQuantity}
            placeholder={String(product.minimumOrderQuantity)}
            placeholderTextColor="#9A9D9A"
            style={styles.input}
            value={quantity}
          />
          <Text style={styles.inputHint}>
            Available: {product.availableQuantity.toLocaleString('en-LK')} {product.unit} • Minimum:{' '}
            {product.minimumOrderQuantity} {product.unit}
          </Text>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated bid value</Text>
            <Text style={styles.totalValue}>{formatLkr(Math.max(0, estimatedTotal))}</Text>
          </View>

          <Text style={styles.notice}>
            Your bid will be saved with an active status for the farmer to review. No payment is
            collected during this evaluation.
          </Text>

          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <PrimaryButton label="Submit Bid" loading={isSubmitting} onPress={submitBid} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  backIcon: {
    color: '#555855',
    fontSize: 38,
    fontWeight: '300',
  },
  topBarTitle: {
    color: '#4D504D',
    fontSize: 17,
    fontWeight: '800',
  },
  topBarSpacer: {
    width: 24,
  },
  productCard: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 11,
  },
  productImage: {
    borderRadius: 10,
    height: 60,
    width: 60,
  },
  productCopy: {
    flex: 1,
    gap: 4,
    marginLeft: 12,
  },
  productName: {
    color: '#4B4E4B',
    fontSize: 15,
    fontWeight: '800',
  },
  seller: {
    color: '#979A97',
    fontSize: 12,
  },
  marketRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  marketCard: {
    backgroundColor: '#FFF8E6',
    borderRadius: 12,
    flex: 1,
    gap: 5,
    padding: 12,
  },
  availabilityCard: {
    backgroundColor: BrandColors.primarySurface,
  },
  marketLabel: {
    color: '#929592',
    fontSize: 10,
  },
  marketValue: {
    color: BrandColors.warning,
    fontSize: 15,
    fontWeight: '800',
  },
  availabilityValue: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#555855',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 18,
  },
  input: {
    borderColor: BrandColors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: '#4D504D',
    fontSize: 16,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  inputHint: {
    color: '#9A9D9A',
    fontSize: 10,
    marginTop: 6,
  },
  totalCard: {
    alignItems: 'center',
    backgroundColor: '#F5F8F5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    padding: 15,
  },
  totalLabel: {
    color: '#5A5D5A',
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  notice: {
    color: '#999C99',
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 16,
  },
  error: {
    color: BrandColors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
});
