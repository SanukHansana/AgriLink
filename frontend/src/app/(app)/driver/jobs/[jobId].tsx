import { useEffect, useState } from 'react';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useDriverJob } from '@/hooks/use-driver-job';
import { useDriverOverview } from '@/hooks/use-driver-overview';
import { getApiErrorMessage } from '@/services/api';
import { acceptDriverJob, updateDriverProfile } from '@/services/driver-service';
import { formatLkr } from '@/utils/formatters';

export default function DriverJobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId: string }>();
  const jobId = Array.isArray(params.jobId) ? params.jobId[0] : params.jobId;
  const { error, isLoading, job, refresh, setJob } = useDriverJob(jobId);
  const overview = useDriverOverview();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const capableVehicles = job
    ? overview.vehicles.filter((vehicle) => vehicle.isActive && vehicle.capacityKg >= job.totalWeightKg)
    : [];

  useEffect(() => {
    if (!selectedVehicleId && capableVehicles[0]) {
      setSelectedVehicleId(capableVehicles[0]._id);
    }
  }, [capableVehicles, selectedVehicleId]);

  if (isLoading || error || !job || overview.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DriverDataState
          error={error ?? overview.error}
          isLoading={isLoading || overview.isLoading}
          onRetry={() => {
            refresh();
            overview.refresh();
          }}
        />
      </SafeAreaView>
    );
  }

  if (job.status !== 'available') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.confirmedContent}>
          <View style={styles.confirmedIcon}><Text style={styles.confirmedIconText}>✓</Text></View>
          <Text style={styles.confirmedTitle}>Trip Confirmed!</Text>
          <Text style={styles.confirmedText}>This delivery is assigned to your driver account.</Text>
          <View style={styles.confirmedCard}>
            <Text style={styles.confirmedLabel}>ROUTE</Text>
            <Text style={styles.confirmedRoute}>
              {job.pickupPoints[0]?.city ?? 'Farm pickup'} → {job.destination.city}
            </Text>
            <View style={styles.confirmedDivider} />
            <View style={styles.confirmedRow}>
              <View><Text style={styles.confirmedLabel}>PAYOUT</Text><Text style={styles.confirmedPayout}>{formatLkr(job.payoutAmount)}</Text></View>
              <View><Text style={styles.confirmedLabel}>STATUS</Text><Text style={styles.confirmedStatus}>{job.status}</Text></View>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(app)/driver' as Href)}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const makeAvailable = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateDriverProfile({ availabilityStatus: 'available' });
      overview.refresh();
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptJob = async () => {
    if (!selectedVehicleId) {
      setSubmitError('Select an active vehicle with enough capacity.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await acceptDriverJob(job._id, selectedVehicleId);
      setJob(result.job);
    } catch (requestError) {
      setSubmitError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={router.back}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Job Details</Text>
            <Text style={styles.jobCode}>Trip #{job.jobCode}</Text>
          </View>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.routeLabel}>STATIC ROUTE OVERVIEW</Text>
          <View style={styles.routeLineRow}>
            {job.pickupPoints.map((pickup, index) => (
              <View key={pickup._id} style={styles.routePart}>
                <View style={styles.pickupMarker}><Text style={styles.markerText}>P{index + 1}</Text></View>
                <View style={styles.routeLine} />
              </View>
            ))}
            <View style={styles.destinationMarker}><Text style={styles.markerText}>D</Text></View>
          </View>
          <Text style={styles.routeTitle}>
            {job.pickupPoints[0]?.city ?? 'Farm'} → {job.destination.city}
            {job.routeDistanceKm ? ` (${job.routeDistanceKm} km)` : ''}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>PICKUP FARMERS</Text>
        <View style={styles.listCard}>
          {job.pickupPoints.map((pickup, index) => (
            <View key={pickup._id} style={[styles.locationItem, index > 0 && styles.itemBorder]}>
              <View style={styles.sequenceBadge}><Text style={styles.sequenceText}>{index + 1}</Text></View>
              <View style={styles.locationCopy}>
                <Text style={styles.contactName}>{pickup.contactName}</Text>
                <Text style={styles.address}>{pickup.addressLine}, {pickup.city}, {pickup.district}</Text>
                {pickup.phone ? <Text style={styles.phone}>{pickup.phone}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>DESTINATION</Text>
        <View style={styles.destinationCard}>
          <Text style={styles.contactName}>{job.destination.contactName}</Text>
          <Text style={styles.address}>{job.destination.addressLine}, {job.destination.city}, {job.destination.district}</Text>
          {job.destination.phone ? <Text style={styles.phone}>{job.destination.phone}</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>TRIP SUMMARY</Text>
        <View style={styles.paymentCard}>
          <SummaryRow label="Cargo" value={job.cargoDescription} />
          <SummaryRow label="Total weight" value={`${job.totalWeightKg.toLocaleString('en-LK')} kg`} />
          <SummaryRow label="Scheduled pickup" value={new Date(job.scheduledPickupAt).toLocaleString('en-LK')} />
          <View style={styles.paymentDivider} />
          <View style={styles.payoutRow}><Text style={styles.payoutLabel}>Total Payout</Text><Text style={styles.payoutValue}>{formatLkr(job.payoutAmount)}</Text></View>
        </View>

        {!overview.profile ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/driver/profile' as Href)}
            style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Driver profile required</Text>
            <Text style={styles.noticeText}>Complete your profile before accepting delivery jobs.</Text>
          </Pressable>
        ) : overview.profile.availabilityStatus !== 'available' ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Go online to accept this job</Text>
            <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={makeAvailable} style={styles.smallButton}>
              <Text style={styles.smallButtonText}>Set Available</Text>
            </Pressable>
          </View>
        ) : capableVehicles.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/driver/profile' as Href)}
            style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Suitable vehicle required</Text>
            <Text style={styles.noticeText}>Add an active vehicle with at least {job.totalWeightKg.toLocaleString('en-LK')} kg capacity.</Text>
          </Pressable>
        ) : (
          <View style={styles.vehicleSection}>
            <Text style={styles.vehicleTitle}>Select Vehicle</Text>
            {capableVehicles.map((vehicle) => {
              const selected = vehicle._id === selectedVehicleId;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={vehicle._id}
                  onPress={() => setSelectedVehicleId(vehicle._id)}
                  style={[styles.vehicleOption, selected && styles.selectedVehicle]}>
                  <Text style={[styles.vehicleName, selected && styles.selectedVehicleText]}>
                    {vehicle.registrationNumber} • {vehicle.capacityKg.toLocaleString('en-LK')} kg
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={!overview.profile || overview.profile.availabilityStatus !== 'available' || !selectedVehicleId || isSubmitting}
          onPress={acceptJob}
          style={[styles.primaryButton, (!overview.profile || overview.profile.availabilityStatus !== 'available' || !selectedVehicleId || isSubmitting) && styles.disabledButton]}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'Please wait...' : 'Accept Job'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text numberOfLines={2} style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { paddingBottom: 32 },
  header: { alignItems: 'center', flexDirection: 'row', minHeight: 70, paddingHorizontal: 20 },
  back: { color: BrandColors.primary, fontSize: 37, lineHeight: 39 },
  headerCopy: { marginLeft: 10 },
  title: { color: BrandColors.primary, fontSize: 20, fontWeight: '800' },
  jobCode: { color: '#989B98', fontSize: 11, marginTop: 2 },
  routeCard: { backgroundColor: '#E5F3E9', padding: 20 },
  routeLabel: { color: BrandColors.primary, fontSize: 9, fontWeight: '800' },
  routeLineRow: { alignItems: 'center', flexDirection: 'row', marginTop: 20 },
  routePart: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  pickupMarker: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  destinationMarker: { alignItems: 'center', backgroundColor: BrandColors.danger, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  markerText: { color: BrandColors.white, fontSize: 10, fontWeight: '800' },
  routeLine: { borderColor: BrandColors.primary, borderStyle: 'dashed', borderTopWidth: 2, flex: 1 },
  routeTitle: { color: '#3F423F', fontSize: 13, fontWeight: '800', marginTop: 17, textAlign: 'center' },
  sectionLabel: { color: '#8E918E', fontSize: 10, fontWeight: '800', marginHorizontal: 20, marginBottom: 8, marginTop: 20 },
  listCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginHorizontal: 20, paddingHorizontal: 14 },
  locationItem: { alignItems: 'center', flexDirection: 'row', paddingVertical: 13 },
  itemBorder: { borderTopColor: BrandColors.border, borderTopWidth: 1 },
  sequenceBadge: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  sequenceText: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' },
  locationCopy: { flex: 1, marginLeft: 11 },
  contactName: { color: '#454845', fontSize: 13, fontWeight: '800' },
  address: { color: '#888B88', fontSize: 10, lineHeight: 15, marginTop: 3 },
  phone: { color: BrandColors.primary, fontSize: 10, marginTop: 3 },
  destinationCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginHorizontal: 20, padding: 14 },
  paymentCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, gap: 10, marginHorizontal: 20, padding: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: '#858885', fontSize: 11 },
  summaryValue: { color: '#474A47', flex: 1, fontSize: 11, fontWeight: '700', marginLeft: 15, textAlign: 'right' },
  paymentDivider: { backgroundColor: BrandColors.border, height: 1 },
  payoutRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  payoutLabel: { color: '#414441', fontSize: 13, fontWeight: '800' },
  payoutValue: { color: BrandColors.primary, fontSize: 17, fontWeight: '800' },
  noticeCard: { backgroundColor: '#FFF4D7', borderRadius: 12, marginHorizontal: 20, marginTop: 18, padding: 13 },
  noticeTitle: { color: '#855F08', fontSize: 12, fontWeight: '800' },
  noticeText: { color: '#8C7848', fontSize: 10, lineHeight: 15, marginTop: 4 },
  smallButton: { alignSelf: 'flex-start', backgroundColor: '#855F08', borderRadius: 8, marginTop: 9, paddingHorizontal: 12, paddingVertical: 7 },
  smallButtonText: { color: BrandColors.white, fontSize: 10, fontWeight: '800' },
  vehicleSection: { marginHorizontal: 20, marginTop: 18 },
  vehicleTitle: { color: '#4A4D4A', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  vehicleOption: { borderColor: BrandColors.border, borderRadius: 10, borderWidth: 1, marginBottom: 7, padding: 11 },
  selectedVehicle: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary },
  vehicleName: { color: '#656865', fontSize: 11, fontWeight: '700' },
  selectedVehicleText: { color: BrandColors.primary },
  error: { color: BrandColors.danger, fontSize: 11, marginHorizontal: 20, marginTop: 10, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: BrandColors.primary, borderRadius: 24, marginHorizontal: 20, marginTop: 18, paddingVertical: 14 },
  primaryButtonText: { color: BrandColors.white, fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  confirmedContent: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 },
  confirmedIcon: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 40, height: 80, justifyContent: 'center', width: 80 },
  confirmedIconText: { color: BrandColors.primary, fontSize: 38, fontWeight: '800' },
  confirmedTitle: { color: BrandColors.primary, fontSize: 23, fontWeight: '800', marginTop: 17 },
  confirmedText: { color: '#777A77', fontSize: 12, marginTop: 7, textAlign: 'center' },
  confirmedCard: { borderColor: BrandColors.border, borderRadius: 14, borderWidth: 1, marginTop: 22, padding: 16, width: '100%' },
  confirmedLabel: { color: '#999C99', fontSize: 9 },
  confirmedRoute: { color: '#444744', fontSize: 14, fontWeight: '800', marginTop: 6 },
  confirmedDivider: { backgroundColor: BrandColors.border, height: 1, marginVertical: 14 },
  confirmedRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confirmedPayout: { color: BrandColors.primary, fontSize: 16, fontWeight: '800', marginTop: 4 },
  confirmedStatus: { color: BrandColors.primary, fontSize: 12, fontWeight: '800', marginTop: 4, textTransform: 'capitalize' },
});
