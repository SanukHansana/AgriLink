import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { DeliveryJob } from '@/types/logistics';
import { formatLkr } from '@/utils/formatters';

export function DeliveryJobCard({
  actionLabel,
  job,
  onPress,
}: {
  actionLabel?: string;
  job: DeliveryJob;
  onPress: () => void;
}) {
  const pickup = job.pickupPoints[0];
  const pickupLabel = pickup ? `${pickup.city}, ${pickup.district}` : 'Farm pickup';
  const destinationLabel = `${job.destination.city}, ${job.destination.district}`;
  const schedule = new Intl.DateTimeFormat('en-LK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(job.scheduledPickupAt));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.routeSummary}>
          {job.routeDistanceKm ? `${job.routeDistanceKm} km` : 'Route pending'}
          {job.pickupPoints.length > 1 ? ` • ${job.pickupPoints.length} pickups` : ''}
        </Text>
        {job.sharedDelivery ? (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedBadgeText}>SHARED</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.locationRow}>
        <View style={[styles.dot, styles.pickupDot]} />
        <Text numberOfLines={1} style={styles.locationText}>{pickupLabel}</Text>
      </View>
      <View style={styles.locationRow}>
        <View style={[styles.dot, styles.destinationDot]} />
        <Text numberOfLines={1} style={styles.locationText}>{destinationLabel}</Text>
      </View>

      <View style={styles.divider} />
      <View style={styles.detailsRow}>
        <View style={styles.cargoCopy}>
          <Text style={styles.detailLabel}>CARGO / PICKUP</Text>
          <Text numberOfLines={1} style={styles.cargoText}>{job.cargoDescription}</Text>
          <Text style={styles.scheduleText}>{schedule}</Text>
        </View>
        <View style={styles.payoutCopy}>
          <Text style={styles.detailLabel}>EARNINGS</Text>
          <Text style={styles.payout}>{formatLkr(job.payoutAmount)}</Text>
          <Text style={styles.weight}>{job.totalWeightKg.toLocaleString('en-LK')} kg</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>
          {actionLabel ?? (job.status === 'available' ? 'View & Accept Job' : 'View Delivery')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 15,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeSummary: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  sharedBadge: {
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  sharedBadgeText: {
    color: BrandColors.primary,
    fontSize: 8,
    fontWeight: '800',
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 7,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  pickupDot: {
    backgroundColor: BrandColors.primary,
  },
  destinationDot: {
    backgroundColor: BrandColors.danger,
  },
  locationText: {
    color: '#454845',
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    backgroundColor: BrandColors.border,
    height: 1,
    marginVertical: 13,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cargoCopy: {
    flex: 1,
    marginRight: 10,
  },
  payoutCopy: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    color: '#999C99',
    fontSize: 9,
  },
  cargoText: {
    color: '#454845',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  scheduleText: {
    color: '#959895',
    fontSize: 10,
    marginTop: 4,
  },
  payout: {
    color: BrandColors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  weight: {
    color: '#959895',
    fontSize: 10,
    marginTop: 4,
  },
  button: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 11,
    marginTop: 14,
    paddingVertical: 12,
  },
  buttonText: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
