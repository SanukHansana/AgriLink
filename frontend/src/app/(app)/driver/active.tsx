import { type Href, useRouter } from 'expo-router';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverOverview } from '@/hooks/use-driver-overview';
import type { DeliveryContactLocation, DeliveryJobStatus } from '@/types/logistics';

const progressSteps: { label: string; status: DeliveryJobStatus }[] = [
  { label: 'Job Accepted', status: 'accepted' },
  { label: 'Arrived at Pickup', status: 'collecting' },
  { label: 'In Transit', status: 'inTransit' },
  { label: 'Delivered', status: 'delivered' },
];
const progressOrder: DeliveryJobStatus[] = ['accepted', 'collecting', 'inTransit', 'delivered'];

export default function DriverActiveDeliveryScreen() {
  const router = useRouter();
  const overview = useDriverOverview();
  const job = overview.myJobs.find((item) =>
    ['accepted', 'collecting', 'inTransit'].includes(item.status),
  );

  if (overview.isLoading || overview.error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DriverDataState
          error={overview.error}
          isLoading={overview.isLoading}
          onRetry={overview.refresh}
        />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyHeader}>
          <Text style={styles.title}>Active Delivery</Text>
          <Text style={styles.subtitle}>Your current collection and delivery trip</Text>
        </View>
        <DriverDataState emptyMessage="Accept an available job to begin a delivery." />
      </SafeAreaView>
    );
  }

  const nextStop = job.status === 'inTransit' ? job.destination : job.pickupPoints[0];
  const currentStepIndex = progressOrder.indexOf(job.status);
  const routeOrigin = job.pickupPoints[0]?.city ?? 'Farm pickup';

  const openMaps = () => {
    const query = encodeURIComponent(
      `${nextStop.addressLine}, ${nextStop.city}, ${nextStop.district}, Sri Lanka`,
    );
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const callContact = () => {
    if (nextStop.phone) Linking.openURL(`tel:${nextStop.phone}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={overview.refresh} refreshing={overview.isLoading} />}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Active Delivery</Text>
        <Text style={styles.subtitle}>Trip in progress · {job.jobCode}</Text>

        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View>
              <Text style={styles.routeLabel}>STATIC ROUTE</Text>
              <Text style={styles.routeTitle}>{routeOrigin} → {job.destination.city}</Text>
            </View>
            <View>
              <Text style={styles.distanceLabel}>DISTANCE</Text>
              <Text style={styles.distanceValue}>{job.routeDistanceKm ? `${job.routeDistanceKm} km` : 'Not set'}</Text>
            </View>
          </View>
          <View style={styles.mapSurface}>
            <View style={styles.routePath} />
            {job.pickupPoints.map((pickup, index) => (
              <View
                key={pickup._id}
                style={[styles.mapMarker, { left: `${12 + index * Math.min(20, 58 / job.pickupPoints.length)}%` }]}>
                <Text style={styles.markerText}>P{index + 1}</Text>
              </View>
            ))}
            <View style={[styles.mapMarker, styles.dropMarker]}><Text style={styles.markerText}>D</Text></View>
          </View>
        </View>

        <View style={styles.stopCard}>
          <View style={styles.stopHeader}>
            <View style={styles.pinBadge}><Text style={styles.pinText}>●</Text></View>
            <View style={styles.stopCopy}>
              <Text style={styles.stopLabel}>{job.status === 'inTransit' ? 'Delivery Destination' : 'Next Pickup'}</Text>
              <Text style={styles.stopName}>{nextStop.contactName}</Text>
              <Text style={styles.stopAddress}>{formatAddress(nextStop)}</Text>
            </View>
            <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>
          </View>
          <Text style={styles.cargo}>Cargo: {job.totalWeightKg.toLocaleString('en-LK')} kg · {job.cargoDescription}</Text>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={openMaps} style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Navigate</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!nextStop.phone}
              onPress={callContact}
              style={[styles.callButton, !nextStop.phone && styles.disabled]}>
              <Text style={styles.callButtonText}>Call Contact</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.cardTitle}>Trip Progress</Text>
          {progressSteps.map((step, index) => {
            const complete = index <= currentStepIndex;
            const current = index === currentStepIndex;
            return (
              <View key={step.status} style={styles.progressRow}>
                <View style={[styles.progressDot, complete && styles.completeDot]}>
                  <Text style={[styles.progressDotText, complete && styles.completeDotText]}>
                    {complete ? '✓' : '·'}
                  </Text>
                </View>
                <Text style={[styles.progressText, current && styles.currentProgress]}>{step.label}</Text>
              </View>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/driver/status/${job._id}` as Href)}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Update Delivery Status</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/driver/issues/new?jobId=${job._id}` as Href)}
          style={styles.issueButton}>
          <Text style={styles.issueButtonText}>Report a Delivery Issue</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatAddress(location: DeliveryContactLocation) {
  return `${location.addressLine}, ${location.city}, ${location.district}`;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { paddingBottom: 30 },
  emptyHeader: { paddingHorizontal: 20, paddingTop: 18 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800', marginHorizontal: 20, marginTop: 16 },
  subtitle: { color: '#929592', fontSize: 11, marginHorizontal: 20, marginTop: 3 },
  routeCard: { backgroundColor: BrandColors.white, marginTop: 17 },
  routeHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  routeLabel: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' },
  routeTitle: { color: '#3E413E', fontSize: 14, fontWeight: '800', marginTop: 4 },
  distanceLabel: { color: BrandColors.warning, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  distanceValue: { color: '#414441', fontSize: 12, fontWeight: '800', marginTop: 4, textAlign: 'right' },
  mapSurface: { backgroundColor: '#DDEDE4', height: 150, justifyContent: 'center', overflow: 'hidden' },
  routePath: { borderColor: BrandColors.primary, borderStyle: 'dashed', borderTopWidth: 4, left: '15%', position: 'absolute', right: '15%', transform: [{ rotate: '-6deg' }] },
  mapMarker: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 17, height: 34, justifyContent: 'center', position: 'absolute', top: '52%', width: 34 },
  dropMarker: { backgroundColor: BrandColors.danger, left: undefined, right: '8%', top: '31%' },
  markerText: { color: BrandColors.white, fontSize: 9, fontWeight: '800' },
  stopCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginHorizontal: 16, marginTop: 17, padding: 15 },
  stopHeader: { alignItems: 'center', flexDirection: 'row' },
  pinBadge: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 9, height: 32, justifyContent: 'center', width: 32 },
  pinText: { color: BrandColors.primary },
  stopCopy: { flex: 1, marginLeft: 10 },
  stopLabel: { color: '#3E413E', fontSize: 13, fontWeight: '800' },
  stopName: { color: BrandColors.primary, fontSize: 12, fontWeight: '700', marginTop: 3 },
  stopAddress: { color: '#8F928F', fontSize: 10, marginTop: 2 },
  activeBadge: { backgroundColor: BrandColors.primarySoft, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6 },
  activeBadgeText: { color: BrandColors.primary, fontSize: 8, fontWeight: '800' },
  cargo: { borderTopColor: BrandColors.border, borderTopWidth: 1, color: '#686B68', fontSize: 10, marginTop: 12, paddingTop: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  outlineButton: { alignItems: 'center', borderColor: BrandColors.primary, borderRadius: 10, borderWidth: 1, flex: 1, paddingVertical: 12 },
  outlineButtonText: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
  callButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 10, flex: 1, paddingVertical: 12 },
  callButtonText: { color: BrandColors.white, fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  progressCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, gap: 13, marginHorizontal: 16, marginTop: 16, padding: 15 },
  cardTitle: { color: '#3E413E', fontSize: 13, fontWeight: '800', marginBottom: 3 },
  progressRow: { alignItems: 'center', flexDirection: 'row' },
  progressDot: { alignItems: 'center', backgroundColor: '#E6E8E6', borderRadius: 10, height: 20, justifyContent: 'center', width: 20 },
  completeDot: { backgroundColor: BrandColors.primary },
  progressDotText: { color: '#A0A3A0', fontSize: 12, fontWeight: '800' },
  completeDotText: { color: BrandColors.white },
  progressText: { color: '#999C99', fontSize: 11, marginLeft: 10 },
  currentProgress: { color: BrandColors.primary, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 24, marginHorizontal: 16, marginTop: 18, paddingVertical: 14 },
  primaryButtonText: { color: BrandColors.white, fontSize: 13, fontWeight: '800' },
  issueButton: { alignItems: 'center', borderColor: BrandColors.warning, borderRadius: 24, borderWidth: 1, marginHorizontal: 16, marginTop: 10, paddingVertical: 13 },
  issueButtonText: { color: BrandColors.warning, fontSize: 12, fontWeight: '800' },
});
