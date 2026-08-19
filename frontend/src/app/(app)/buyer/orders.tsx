import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BuyerDataState } from '@/components/buyer/buyer-data-state';
import { BrandColors } from '@/constants/theme';
import { useBuyerOrders } from '@/hooks/use-buyer-orders';
import type { BuyerOrder, OrderStatus } from '@/types/transactions';
import { formatLkr } from '@/utils/formatters';

type OrderFilter = 'all' | 'active' | 'delivered';

const filters: { label: string; value: OrderFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Delivered', value: 'delivered' },
];

const activeStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'dispatched',
  'inTransit',
];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  dispatched: 'Dispatched',
  inTransit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const { orders, error, isLoading, refresh } = useBuyerOrders();

  const visibleOrders = useMemo(() => {
    if (filter === 'active') {
      return orders.filter((order) => activeStatuses.includes(order.status));
    }

    if (filter === 'delivered') {
      return orders.filter((order) => order.status === 'delivered');
    }

    return orders;
  }, [filter, orders]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <Text style={styles.title}>Your Orders</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/buyer/bids')}
            style={styles.bidsButton}>
            <Text style={styles.bidsButtonText}>My Bids</Text>
          </Pressable>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => {
            const active = item.value === filter;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.value}
                onPress={() => setFilter(item.value)}
                style={[styles.filter, active && styles.activeFilter]}>
                <Text style={[styles.filterText, active && styles.activeFilterText]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading || error || visibleOrders.length === 0 ? (
          <BuyerDataState
            emptyMessage={
              filter === 'all'
                ? 'Your fixed-price and advance orders will appear here.'
                : `There are no ${filter} orders right now.`
            }
            emptyTitle="No orders found"
            error={error}
            isLoading={isLoading}
            loadingMessage="Loading your orders…"
            onRetry={refresh}
          />
        ) : (
          <View style={styles.orderList}>
            {visibleOrders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: BuyerOrder }) {
  const router = useRouter();
  const product = typeof order.product === 'string' ? null : order.product;
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const dateLabel = new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(order.createdAt));

  const openTracking = () => {
    router.push({
      pathname: '/(app)/buyer/tracking/[orderId]',
      params: { orderId: order._id },
    });
  };

  const openFeedback = () => {
    router.push({
      pathname: '/(app)/buyer/feedback/[orderId]',
      params: { orderId: order._id },
    });
  };

  const reorder = () => {
    if (!product) return;
    router.push({
      pathname: '/(app)/buyer/search/[productId]',
      params: { productId: product._id },
    });
  };

  return (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderCode}>Order ID: {order.orderCode}</Text>
        <View style={[styles.statusBadge, statusBadgeStyle(order.status)]}>
          <Text style={[styles.statusText, statusTextStyle(order.status)]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text numberOfLines={1} style={styles.productName}>
        {product?.name ?? 'Agricultural product'}
      </Text>
      <Text style={styles.orderMeta}>
        Qty: {order.quantity.toLocaleString('en-LK')} {order.unit} •{' '}
        {order.orderType === 'advance' ? 'Advance order' : 'Direct purchase'}
      </Text>
      <Text style={styles.total}>Total: {formatLkr(order.totalAmount)}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.date}>{dateLabel}</Text>
        <View style={styles.cardActions}>
          <Pressable accessibilityRole="button" onPress={openFeedback} style={styles.feedbackButton}>
            <Text style={styles.feedbackButtonText}>{isDelivered ? 'Feedback' : 'Report Issue'}</Text>
          </Pressable>
          {isDelivered && product ? (
            <Pressable accessibilityRole="button" onPress={reorder} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Order Again</Text>
            </Pressable>
          ) : !isCancelled ? (
            <Pressable accessibilityRole="button" onPress={openTracking} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Track Order</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function statusBadgeStyle(status: OrderStatus) {
  if (status === 'delivered') return styles.statusDelivered;
  if (status === 'cancelled') return styles.statusCancelled;
  if (status === 'inTransit' || status === 'dispatched') return styles.statusTransit;
  return styles.statusPending;
}

function statusTextStyle(status: OrderStatus) {
  if (status === 'delivered') return styles.statusTextDelivered;
  if (status === 'cancelled') return styles.statusTextCancelled;
  if (status === 'inTransit' || status === 'dispatched') return styles.statusTextTransit;
  return styles.statusTextPending;
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
  bidsButton: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  bidsButtonText: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  filters: {
    flexDirection: 'row',
    gap: 9,
    paddingBottom: 18,
    paddingTop: 22,
  },
  filter: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 18,
    paddingHorizontal: 16,
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
  orderList: {
    gap: 12,
  },
  orderCard: {
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderCode: {
    color: '#505350',
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusPending: {
    backgroundColor: '#FFF1C9',
  },
  statusTransit: {
    backgroundColor: '#DDEBFF',
  },
  statusDelivered: {
    backgroundColor: BrandColors.primarySoft,
  },
  statusCancelled: {
    backgroundColor: '#FFE1E1',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextPending: {
    color: BrandColors.warning,
  },
  statusTextTransit: {
    color: '#2563D9',
  },
  statusTextDelivered: {
    color: BrandColors.primary,
  },
  statusTextCancelled: {
    color: BrandColors.danger,
  },
  divider: {
    backgroundColor: BrandColors.border,
    height: 1,
    marginVertical: 12,
  },
  productName: {
    color: BrandColors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  orderMeta: {
    color: '#929592',
    fontSize: 12,
    marginTop: 5,
  },
  total: {
    color: '#4D504D',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 13,
  },
  date: {
    color: '#9A9D9A',
    fontSize: 11,
  },
  actionButton: {
    backgroundColor: BrandColors.primary,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: BrandColors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
  },
  feedbackButton: {
    borderColor: BrandColors.primary,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  feedbackButtonText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
});
