import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuyerDataState } from '@/components/buyer/buyer-data-state';
import { BrandColors } from '@/constants/theme';
import { useBuyerOrder } from '@/hooks/use-buyer-order';
import { getApiErrorMessage } from '@/services/api';
import { createBuyerComplaint, createBuyerReview } from '@/services/feedback-service';
import {
  COMPLAINT_CATEGORIES,
  type ComplaintCategory,
} from '@/types/feedback';

const categoryLabels: Record<ComplaintCategory, string> = {
  productQuality: 'Product Quality',
  delivery: 'Delivery',
  seller: 'Seller',
  payment: 'Payment',
  other: 'Other',
};

export default function BuyerFeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const { error, isLoading, order, refresh } = useBuyerOrder(orderId);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>('productQuality');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [isComplaintSaving, setIsComplaintSaving] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const submitReview = async () => {
    if (!orderId || rating < 1) {
      setReviewError('Select a rating from 1 to 5.');
      return;
    }

    setIsReviewSaving(true);
    setReviewError(null);
    try {
      await createBuyerReview(orderId, {
        rating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSubmitted(true);
    } catch (requestError) {
      setReviewError(getApiErrorMessage(requestError));
    } finally {
      setIsReviewSaving(false);
    }
  };

  const submitComplaint = async () => {
    if (!orderId || complaintDescription.trim().length < 10) {
      setComplaintError('Describe the issue using at least 10 characters.');
      return;
    }

    setIsComplaintSaving(true);
    setComplaintError(null);
    try {
      await createBuyerComplaint(orderId, {
        category,
        description: complaintDescription.trim(),
      });
      setComplaintSubmitted(true);
    } catch (requestError) {
      setComplaintError(getApiErrorMessage(requestError));
    } finally {
      setIsComplaintSaving(false);
    }
  };

  const productName =
    order && typeof order.product !== 'string' ? order.product.name : 'Agricultural product';

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Order Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading || error || !order ? (
        <BuyerDataState
          emptyMessage="This order could not be found."
          emptyTitle="Order unavailable"
          error={error}
          isLoading={isLoading}
          loadingMessage="Loading order feedback…"
          onRetry={refresh}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.orderSummary}>
            <Text style={styles.orderCode}>{order.orderCode}</Text>
            <Text numberOfLines={1} style={styles.productName}>
              {productName}
            </Text>
            <Text style={styles.orderMeta}>
              {order.quantity.toLocaleString('en-LK')} {order.unit} • {order.status}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate Your Order</Text>
            {order.status !== 'delivered' ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Ratings become available after delivery is completed.</Text>
              </View>
            ) : reviewSubmitted ? (
              <SuccessPanel message="Thank you. Your rating was saved." />
            ) : (
              <>
                <Text style={styles.helperText}>How was your experience with this order?</Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = value <= rating;
                    return (
                      <Pressable
                        accessibilityLabel={`${value} star rating`}
                        accessibilityRole="button"
                        key={value}
                        onPress={() => setRating(value)}
                        style={[styles.ratingButton, selected && styles.selectedRatingButton]}>
                        <Text style={[styles.ratingText, selected && styles.selectedRatingText]}>
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  maxLength={600}
                  multiline
                  onChangeText={setReviewComment}
                  placeholder="Add an optional comment about product quality or service…"
                  placeholderTextColor="#A0A3A0"
                  style={styles.textArea}
                  textAlignVertical="top"
                  value={reviewComment}
                />
                {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={isReviewSaving}
                  onPress={submitReview}
                  style={[styles.primaryButton, isReviewSaving && styles.disabledButton]}>
                  <Text style={styles.primaryButtonText}>
                    {isReviewSaving ? 'Submitting…' : 'Submit Rating'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Report an Issue</Text>
            {complaintSubmitted ? (
              <SuccessPanel message="Your complaint was submitted for review." />
            ) : (
              <>
                <Text style={styles.fieldLabel}>Issue Category</Text>
                <View style={styles.categoryOptions}>
                  {COMPLAINT_CATEGORIES.map((value) => {
                    const selected = category === value;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={value}
                        onPress={() => setCategory(value)}
                        style={[styles.categoryOption, selected && styles.selectedCategory]}>
                        <Text style={[styles.categoryText, selected && styles.selectedCategoryText]}>
                          {categoryLabels[value]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  maxLength={1000}
                  multiline
                  onChangeText={setComplaintDescription}
                  placeholder="Describe what happened and what assistance you need…"
                  placeholderTextColor="#A0A3A0"
                  style={[styles.textArea, styles.complaintArea]}
                  textAlignVertical="top"
                  value={complaintDescription}
                />
                <Text style={styles.characterCount}>{complaintDescription.length}/1000</Text>
                {complaintError ? <Text style={styles.errorText}>{complaintError}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={isComplaintSaving}
                  onPress={submitComplaint}
                  style={[styles.complaintButton, isComplaintSaving && styles.disabledButton]}>
                  <Text style={styles.complaintButtonText}>
                    {isComplaintSaving ? 'Submitting…' : 'Submit Complaint'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SuccessPanel({ message }: { message: string }) {
  return (
    <View style={styles.successPanel}>
      <Text style={styles.successSymbol}>✓</Text>
      <Text style={styles.successText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAF8',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: BrandColors.white,
    borderBottomColor: BrandColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: 18,
  },
  back: {
    color: '#4D504D',
    fontSize: 38,
    lineHeight: 38,
  },
  headerTitle: {
    color: '#4A4D4A',
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 22,
  },
  content: {
    gap: 15,
    padding: 16,
    paddingBottom: 36,
  },
  orderSummary: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 15,
    padding: 15,
  },
  orderCode: {
    color: BrandColors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  productName: {
    color: '#414441',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  orderMeta: {
    color: '#7D817D',
    fontSize: 11,
    marginTop: 5,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    color: '#454845',
    fontSize: 16,
    fontWeight: '800',
  },
  helperText: {
    color: '#8D908D',
    fontSize: 12,
    marginTop: 7,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 9,
    marginVertical: 15,
  },
  ratingButton: {
    alignItems: 'center',
    backgroundColor: '#F2F4F2',
    borderColor: BrandColors.border,
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  selectedRatingButton: {
    backgroundColor: '#FFF4CA',
    borderColor: '#F1C83D',
  },
  ratingText: {
    color: '#858885',
    fontSize: 15,
    fontWeight: '800',
  },
  selectedRatingText: {
    color: '#B57A00',
  },
  textArea: {
    borderColor: BrandColors.border,
    borderRadius: 11,
    borderWidth: 1,
    color: '#434643',
    fontSize: 13,
    lineHeight: 19,
    minHeight: 100,
    padding: 12,
  },
  complaintArea: {
    marginTop: 14,
    minHeight: 125,
  },
  fieldLabel: {
    color: '#606360',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 13,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 9,
  },
  categoryOption: {
    backgroundColor: BrandColors.primarySurface,
    borderColor: BrandColors.primarySoft,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  selectedCategory: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  categoryText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  selectedCategoryText: {
    color: BrandColors.white,
  },
  characterCount: {
    color: '#A0A3A0',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'right',
  },
  errorText: {
    color: BrandColors.danger,
    fontSize: 11,
    marginTop: 9,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 23,
    marginTop: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  complaintButton: {
    alignItems: 'center',
    borderColor: BrandColors.danger,
    borderRadius: 23,
    borderWidth: 1,
    marginTop: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  complaintButtonText: {
    color: BrandColors.danger,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  notice: {
    backgroundColor: '#FFF7DA',
    borderRadius: 10,
    marginTop: 13,
    padding: 12,
  },
  noticeText: {
    color: '#84681B',
    fontSize: 11,
    lineHeight: 16,
  },
  successPanel: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySurface,
    borderRadius: 11,
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
    padding: 13,
  },
  successSymbol: {
    color: BrandColors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  successText: {
    color: BrandColors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});
