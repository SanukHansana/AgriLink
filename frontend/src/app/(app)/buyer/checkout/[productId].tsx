import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { ProductImage } from '@/components/buyer/product-image';
import { BrandColors } from '@/constants/theme';
import { useMarketplaceProduct } from '@/hooks/use-marketplace-product';
import { getApiErrorMessage } from '@/services/api';
import { createFixedPriceOrder } from '@/services/order-service';
import type { BuyerOrder } from '@/types/transactions';
import { formatLkr, getSellerName } from '@/utils/formatters';

export default function BuyerCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId: string; quantity?: string }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const requestedQuantity = Number(Array.isArray(params.quantity) ? params.quantity[0] : params.quantity);
  const { error: productError, isLoading, product, refresh } = useMarketplaceProduct(productId);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<BuyerOrder | null>(null);

  if (isLoading || productError || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <MarketplaceState error={productError} isLoading={isLoading} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  if (createdOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Order placed!</Text>
          <Text style={styles.successMessage}>
            Your fixed-price order was saved and is ready for the farmer to review.
          </Text>
          <View style={styles.successCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order</Text>
              <Text style={styles.summaryValue}>{createdOrder.orderCode}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.successTotal}>{formatLkr(createdOrder.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>Pending</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(app)/buyer')}
            style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Back to Marketplace</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const quantity =
    Number.isFinite(requestedQuantity) && requestedQuantity > 0
      ? Math.max(requestedQuantity, product.minimumOrderQuantity)
      : product.minimumOrderQuantity;
  const price = product.fixedPrice ?? 0;
  const subtotal = price * quantity;

  const placeOrder = async () => {
    setSubmitError(null);

    if (!addressLine.trim() || !city.trim() || !district.trim()) {
      setSubmitError('Delivery address, city and district are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createFixedPriceOrder({
        productId,
        quantity,
        deliveryAddress: {
          addressLine: addressLine.trim(),
          city: city.trim(),
          district: district.trim(),
          postalCode: postalCode.trim() || undefined,
        },
      });
      setCreatedOrder(result.order);
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
            <Text style={styles.topBarTitle}>Checkout</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <Text style={styles.sectionLabel}>ORDER ITEM</Text>
          <View style={styles.productCard}>
            <ProductImage product={product} style={styles.productImage} />
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.seller}>by {getSellerName(product)}</Text>
              <Text style={styles.quantity}>{quantity.toLocaleString('en-LK')} {product.unit}</Text>
            </View>
            <Text style={styles.productTotal}>{formatLkr(subtotal)}</Text>
          </View>

          <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
          <View style={styles.formCard}>
            <FormField
              autoCapitalize="words"
              label="Address"
              onChangeText={setAddressLine}
              placeholder="No. 45, Temple Road"
              value={addressLine}
            />
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <FormField
                  autoCapitalize="words"
                  label="City"
                  onChangeText={setCity}
                  placeholder="Colombo 03"
                  value={city}
                />
              </View>
              <View style={styles.formColumn}>
                <FormField
                  autoCapitalize="words"
                  label="District"
                  onChangeText={setDistrict}
                  placeholder="Colombo"
                  value={district}
                />
              </View>
            </View>
            <FormField
              keyboardType="number-pad"
              label="Postal code (optional)"
              onChangeText={setPostalCode}
              placeholder="00300"
              value={postalCode}
            />
          </View>

          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentMark} />
            <View style={styles.paymentCopy}>
              <Text style={styles.paymentTitle}>Payment arranged after confirmation</Text>
              <Text style={styles.paymentDescription}>Payment gateway is postponed for evaluation.</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatLkr(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text style={styles.summaryValue}>Arranged later</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total LKR</Text>
              <Text style={styles.totalValue}>{formatLkr(subtotal)}</Text>
            </View>
          </View>

          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <PrimaryButton
            label="Confirm & Place Order"
            loading={isSubmitting}
            onPress={placeOrder}
          />
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
    paddingHorizontal: 16,
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
  sectionLabel: {
    color: '#5A5D5A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 16,
  },
  productCard: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 11,
  },
  productImage: {
    borderRadius: 9,
    height: 58,
    width: 58,
  },
  productCopy: {
    flex: 1,
    gap: 3,
    marginLeft: 10,
  },
  productName: {
    color: '#4D504D',
    fontSize: 14,
    fontWeight: '800',
  },
  seller: {
    color: '#989B98',
    fontSize: 11,
  },
  quantity: {
    color: '#626562',
    fontSize: 11,
    fontWeight: '700',
  },
  productTotal: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  formCard: {
    borderColor: BrandColors.border,
    borderRadius: 13,
    borderWidth: 1,
    gap: 13,
    padding: 13,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formColumn: {
    flex: 1,
  },
  paymentCard: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 13,
  },
  paymentMark: {
    backgroundColor: BrandColors.primary,
    borderRadius: 4,
    height: 20,
    width: 28,
  },
  paymentCopy: {
    flex: 1,
    gap: 3,
    marginLeft: 10,
  },
  paymentTitle: {
    color: '#555855',
    fontSize: 13,
    fontWeight: '800',
  },
  paymentDescription: {
    color: '#999C99',
    fontSize: 10,
  },
  totalCard: {
    gap: 9,
    marginVertical: 19,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#8E918E',
    fontSize: 13,
  },
  summaryValue: {
    color: '#565956',
    fontSize: 13,
    fontWeight: '700',
  },
  totalDivider: {
    backgroundColor: BrandColors.border,
    height: 1,
  },
  totalLabel: {
    color: '#4D504D',
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: BrandColors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  error: {
    color: BrandColors.danger,
    fontSize: 13,
    marginBottom: 12,
  },
  successContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  successIconText: {
    color: BrandColors.primary,
    fontSize: 40,
    fontWeight: '700',
  },
  successTitle: {
    color: BrandColors.primary,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 18,
  },
  successMessage: {
    color: '#777A77',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  successCard: {
    borderColor: BrandColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginTop: 24,
    padding: 16,
    width: '100%',
  },
  successTotal: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  homeButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 24,
    marginTop: 22,
    paddingVertical: 14,
    width: '100%',
  },
  homeButtonText: {
    color: BrandColors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
