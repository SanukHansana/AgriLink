import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarketplaceState } from '@/components/buyer/marketplace-state';
import { BrandColors } from '@/constants/theme';
import { useBuyerBids } from '@/hooks/use-buyer-bids';
import type { BidStatus, BuyerBid } from '@/types/transactions';
import { formatLkr } from '@/utils/formatters';

const filters: { label: string; value?: BidStatus }[] = [
  { label: 'All' },
  { label: 'Active', value: 'active' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Expired', value: 'expired' },
];

const statusLabels: Record<BidStatus, string> = {
  active: 'Active',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
};

export default function BuyerBidsScreen() {
  const [status, setStatus] = useState<BidStatus | undefined>();
  const { bids, error, isLoading, refresh } = useBuyerBids(status);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <Text style={styles.title}>My Bids</Text>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>MongoDB saved bids</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => {
            const active = filter.value === status;
            return (
              <Pressable
                accessibilityRole="button"
                key={filter.label}
                onPress={() => setStatus(filter.value)}
                style={[styles.filter, active && styles.activeFilter]}>
                <Text style={[styles.filterText, active && styles.activeFilterText]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading || error || bids.length === 0 ? (
          <MarketplaceState error={error} isLoading={isLoading} onRetry={refresh} />
        ) : (
          <View style={styles.bidList}>
            {bids.map((bid) => (
              <BidCard bid={bid} key={bid._id} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BidCard({ bid }: { bid: BuyerBid }) {
  const productName = typeof bid.product === 'string' ? 'Product bid' : bid.product.name;

  return (
    <View style={styles.bidCard}>
      <View style={styles.bidCardHeader}>
        <Text numberOfLines={1} style={styles.productName}>
          {productName}
        </Text>
        <View style={[styles.statusBadge, styles[`status_${bid.status}`]]}>
          <Text style={[styles.statusText, styles[`statusText_${bid.status}`]]}>
            {statusLabels[bid.status]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.bidValues}>
        <View>
          <Text style={styles.valueLabel}>YOUR BID PRICE</Text>
          <Text style={styles.bidPrice}>{formatLkr(bid.bidAmount)}/{bid.unit}</Text>
        </View>
        <View style={styles.rightValue}>
          <Text style={styles.valueLabel}>QUANTITY / TOTAL</Text>
          <Text style={styles.valueText}>
            {bid.quantity.toLocaleString('en-LK')} {bid.unit} • {formatLkr(bid.totalAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 22,
  },
  title: {
    color: '#4A4D4A',
    fontSize: 22,
    fontWeight: '800',
  },
  infoBadge: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  infoBadgeText: {
    color: BrandColors.primary,
    fontSize: 9,
    fontWeight: '800',
  },
  filters: {
    gap: 8,
    paddingBottom: 18,
    paddingTop: 20,
  },
  filter: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  activeFilter: {
    backgroundColor: BrandColors.primary,
  },
  filterText: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  activeFilterText: {
    color: BrandColors.white,
  },
  bidList: {
    gap: 12,
  },
  bidCard: {
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
  },
  bidCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productName: {
    color: '#4D504D',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  status_active: {
    backgroundColor: BrandColors.primarySoft,
  },
  status_accepted: {
    backgroundColor: '#DDEBFF',
  },
  status_rejected: {
    backgroundColor: '#FFE1E1',
  },
  status_expired: {
    backgroundColor: '#ECEEEC',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusText_active: {
    color: BrandColors.primary,
  },
  statusText_accepted: {
    color: '#2563D9',
  },
  statusText_rejected: {
    color: BrandColors.danger,
  },
  statusText_expired: {
    color: '#676A67',
  },
  divider: {
    backgroundColor: BrandColors.border,
    height: 1,
    marginVertical: 13,
  },
  bidValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightValue: {
    alignItems: 'flex-end',
    flex: 1,
  },
  valueLabel: {
    color: '#9A9D9A',
    fontSize: 9,
  },
  bidPrice: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  valueText: {
    color: '#545754',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
});
