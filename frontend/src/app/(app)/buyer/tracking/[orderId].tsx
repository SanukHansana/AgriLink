import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useBuyerOrder } from '@/hooks/use-buyer-order';
import type { BuyerOrder, OrderStatus } from '@/types/transactions';

const progressSteps: { label: string; status: OrderStatus }[] = [
  { label: 'Order placed', status: 'pending' },
  { label: 'Order confirmed', status: 'confirmed' },
  { label: 'Preparing at the farm', status: 'preparing' },
  { label: 'Dispatched for delivery', status: 'dispatched' },
  { label: 'In transit', status: 'inTransit' },
  { label: 'Delivered', status: 'delivered' },
];

const statusRank: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  dispatched: 3,
  inTransit: 4,
  delivered: 5,
  cancelled: -1,
};

export default function BuyerDeliveryTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const { order, error, isLoading, refresh } = useBuyerOrder(orderId);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Delivery Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading || error || !order ? (
        <BuyerDataState
          emptyMessage="This order could not be found."
          emptyTitle="Order unavailable"
          error={error}
          isLoading={isLoading}
          loadingMessage="Loading delivery progress…"
          onRetry={refresh}
        />
      ) : (
        <TrackingContent order={order} onRefresh={refresh} refreshing={isLoading} />
      )}
    </SafeAreaView>
  );
}

function TrackingContent({
  onRefresh,
  order,
  refreshing,
}: {
  onRefresh: () => void;
  order: BuyerOrder;
  refreshing: boolean;
}) {
  const product = typeof order.product === 'string' ? null : order.product;
  const sellerName = typeof order.seller === 'string' ? 'Registered farmer' : order.seller.name;
  const origin = product?.farmLocation
    ? [product.farmLocation.city, product.farmLocation.district].filter(Boolean).join(', ')
    : 'Farm location';
  const destination = [order.deliveryAddress.city, order.deliveryAddress.district]
    .filter(Boolean)
    .join(', ');
  const currentRank = statusRank[order.status];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />}
      showsVerticalScrollIndicator={false}>
      <View style={styles.routeCard}>
        <View style={styles.routeHeading}>
          <Text style={styles.routeLabel}>DELIVERY ROUTE</Text>
          <Text style={styles.orderCode}>{order.orderCode}</Text>
        </View>
        <View style={styles.routeVisual}>
          <View style={styles.routePoint}>
            <Text style={styles.routePointText}>F</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={[styles.routePoint, styles.destinationPoint]}>
            <Text style={styles.routePointText}>B</Text>
          </View>
        </View>
        <View style={styles.routeLocations}>
          <View style={styles.locationColumn}>
            <Text style={styles.locationCaption}>FROM</Text>
            <Text style={styles.locationValue}>{origin}</Text>
          </View>
          <View style={[styles.locationColumn, styles.destinationColumn]}>
            <Text style={styles.locationCaption}>TO</Text>
            <Text style={styles.locationValue}>{destination}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sellerCard}>
        <View style={styles.sellerAvatar}>
          <Text style={styles.sellerAvatarText}>{sellerName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.sellerCopy}>
          <Text style={styles.sellerCaption}>Farmer / Seller</Text>
          <Text style={styles.sellerName}>{sellerName}</Text>
          <Text style={styles.productText}>
            {product?.name ?? 'Agricultural product'} • {order.quantity.toLocaleString('en-LK')}{' '}
            {order.unit}
          </Text>
        </View>
      </View>

      {order.status === 'cancelled' ? (
        <View style={styles.cancelledCard}>
          <Text style={styles.cancelledTitle}>Order cancelled</Text>
          <Text style={styles.cancelledText}>Delivery tracking is unavailable for this order.</Text>
        </View>
      ) : (
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Delivery Progress</Text>
          {progressSteps.map((step, index) => {
            const complete = currentRank >= index;
            const current = currentRank === index;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepMarkerColumn}>
                  <View
                    style={[
                      styles.stepMarker,
                      complete && styles.completeMarker,
                      current && styles.currentMarker,
                    ]}>
                    <Text style={[styles.stepCheck, complete && styles.completeStepCheck]}>
                      {complete ? '✓' : ''}
                    </Text>
                  </View>
                  {index < progressSteps.length - 1 ? (
                    <View style={[styles.stepLine, complete && styles.completeLine]} />
                  ) : null}
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepLabel, complete && styles.completeStepLabel]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDescription}>
                    {current
                      ? 'Current status from your AgriLink order'
                      : complete
                        ? 'Completed'
                        : 'Waiting for an update'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.deliveryCard}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.deliveryAddress}>{order.deliveryAddress.addressLine}</Text>
        <Text style={styles.deliveryAddress}>
          {order.deliveryAddress.city}, {order.deliveryAddress.district}
          {order.deliveryAddress.postalCode ? ` ${order.deliveryAddress.postalCode}` : ''}
        </Text>
        <View style={styles.driverNotice}>
          <Text style={styles.driverNoticeText}>
            Driver contact and live-map coordinates will appear after a driver accepts this delivery.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  header: {
    alignItems: 'center',
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
    gap: 16,
    padding: 16,
    paddingBottom: 34,
  },
  routeCard: {
    backgroundColor: '#EAF6EE',
    borderRadius: 17,
    padding: 17,
  },
  routeHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeLabel: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  orderCode: {
    color: '#6D716D',
    fontSize: 11,
    fontWeight: '700',
  },
  routeVisual: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 19,
    paddingHorizontal: 8,
  },
  routePoint: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  destinationPoint: {
    backgroundColor: '#E34D4D',
  },
  routePointText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  routeLine: {
    borderColor: BrandColors.primary,
    borderStyle: 'dashed',
    borderTopWidth: 2,
    flex: 1,
  },
  routeLocations: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationColumn: {
    flex: 1,
  },
  destinationColumn: {
    alignItems: 'flex-end',
  },
  locationCaption: {
    color: '#8E928E',
    fontSize: 9,
  },
  locationValue: {
    color: '#3F423F',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  sellerCard: {
    alignItems: 'center',
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  sellerAvatar: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sellerAvatarText: {
    color: BrandColors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  sellerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  sellerCaption: {
    color: '#969996',
    fontSize: 10,
  },
  sellerName: {
    color: '#4A4D4A',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  productText: {
    color: '#858885',
    fontSize: 11,
    marginTop: 4,
  },
  progressSection: {
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    color: '#4D504D',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 13,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 63,
  },
  stepMarkerColumn: {
    alignItems: 'center',
    width: 28,
  },
  stepMarker: {
    alignItems: 'center',
    backgroundColor: '#E6E8E6',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  completeMarker: {
    backgroundColor: BrandColors.primary,
  },
  currentMarker: {
    borderColor: '#B9E2C9',
    borderWidth: 4,
    height: 24,
    width: 24,
  },
  stepCheck: {
    color: '#9EA19E',
    fontSize: 10,
    fontWeight: '800',
  },
  completeStepCheck: {
    color: BrandColors.white,
  },
  stepLine: {
    backgroundColor: '#E6E8E6',
    flex: 1,
    marginVertical: 3,
    width: 2,
  },
  completeLine: {
    backgroundColor: BrandColors.primary,
  },
  stepCopy: {
    flex: 1,
    paddingLeft: 9,
  },
  stepLabel: {
    color: '#9A9D9A',
    fontSize: 13,
    fontWeight: '700',
  },
  completeStepLabel: {
    color: '#4A4D4A',
  },
  stepDescription: {
    color: '#A0A3A0',
    fontSize: 11,
    marginTop: 4,
  },
  deliveryCard: {
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    padding: 16,
  },
  deliveryAddress: {
    color: '#646764',
    fontSize: 13,
    lineHeight: 20,
  },
  driverNotice: {
    backgroundColor: BrandColors.primarySurface,
    borderRadius: 10,
    marginTop: 13,
    padding: 11,
  },
  driverNoticeText: {
    color: '#667066',
    fontSize: 11,
    lineHeight: 16,
  },
  cancelledCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 14,
    padding: 16,
  },
  cancelledTitle: {
    color: BrandColors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelledText: {
    color: '#8B6666',
    fontSize: 12,
    marginTop: 5,
  },
});
