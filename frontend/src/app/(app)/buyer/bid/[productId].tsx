import { DateTimeField } from '@/components/date-time-field';
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
import { LocationFields, type MapPin } from '@/components/location-fields';
import { FormField } from '@/components/auth/form-field';
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
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [pin, setPin] = useState<MapPin>({});
  const [deliveryDate, setDeliveryDate] = useState('');
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
    if (product.pricingMode === 'fixedPrice' || !product.biddingClosesAt || new Date(product.biddingClosesAt) <= new Date()) {
      setSubmitError('Bidding is not open for this listing.'); return;
    }
    if (numericBid < (product.minimumBidPrice ?? 0)) {
      setSubmitError(`Bid price must be at least ${formatLkr(product.minimumBidPrice ?? 0)} per ${product.unit}.`); return;
    }
    if (numericQuantity < product.minimumOrderQuantity || numericQuantity > product.availableQuantity) {
      setSubmitError('Enter a quantity within the minimum order and available stock.'); return;
    }
    if (!addressLine.trim() || !city.trim() || !district.trim()) {
      setSubmitError('Enter your delivery address, city and district.'); return;
    }
    const requestedDate = deliveryDate ? new Date(deliveryDate) : null;
    if (product.listingType === 'future' && (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || !requestedDate || Number.isNaN(requestedDate.getTime()) || (product.harvestDate && requestedDate < new Date(product.harvestDate)))) {
      setSubmitError('Enter a delivery date on or after the harvest date.'); return;
    }

    setIsSubmitting(true);
    try {
      await createBuyerBid({
        productId,
        bidAmount: numericBid,
        quantity: numericQuantity,
        deliveryAddress: { addressLine: addressLine.trim(), city: city.trim(), district: district.trim(), ...pin },
        requestedDeliveryDate: product.listingType === 'future' ? requestedDate?.toISOString() : undefined,
      });
      router.replace('/(app)/buyer/bids');
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

          <View style={{ gap: 14, marginTop: 20 }}>
            <Text style={styles.inputHint}>Bidding closes: {product.biddingClosesAt ? new Date(product.biddingClosesAt).toLocaleString() : 'Not available'}</Text>
            <FormField label="Delivery address" value={addressLine} onChangeText={setAddressLine} maxLength={180} placeholder="Street address" />
            <FormField label="City" value={city} onChangeText={setCity} maxLength={80} placeholder="Delivery city" />
            <FormField label="District" value={district} onChangeText={setDistrict} maxLength={80} placeholder="Delivery district" />
            <LocationFields value={pin} onChange={setPin} />
            {product.listingType === 'future' && <DateTimeField label="Requested delivery date" value={deliveryDate} onChangeText={setDeliveryDate} placeholder="YYYY-MM-DD" maxLength={10} />}
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated bid value</Text>
            <Text style={styles.totalValue}>{formatLkr(Math.max(0, estimatedTotal))}</Text>
          </View>

          <Text style={styles.notice}>
            If the farmer accepts your bid before bidding closes, a confirmed order is created at
            your bid price with this delivery address. Stock is reserved on acceptance. No payment is collected here.
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
