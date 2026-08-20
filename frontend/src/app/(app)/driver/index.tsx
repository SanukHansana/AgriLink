import { useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeliveryJobCard } from '@/components/driver/delivery-job-card';
import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useDriverOverview } from '@/hooks/use-driver-overview';
import { getApiErrorMessage } from '@/services/api';
import { updateDriverProfile } from '@/services/driver-service';
import { formatLkr } from '@/utils/formatters';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { availableJobs, error, isLoading, myJobs, profile, refresh, vehicles } =
    useDriverOverview();
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  if (isLoading || error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <DriverDataState error={error} isLoading={isLoading} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const firstName = user?.name.split(' ')[0] ?? 'Driver';
  const activeVehicle = vehicles.find((vehicle) => vehicle.isActive);
  const activeJob = myJobs.find((job) => ['accepted', 'collecting', 'inTransit'].includes(job.status));
  const status = profile?.availabilityStatus ?? 'offline';

  const toggleAvailability = async () => {
    if (!profile || status === 'busy') return;
    setIsUpdatingAvailability(true);
    setAvailabilityError(null);
    try {
      await updateDriverProfile({
        availabilityStatus: status === 'available' ? 'offline' : 'available',
      });
      refresh();
    } catch (requestError) {
      setAvailabilityError(getApiErrorMessage(requestError));
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl onRefresh={refresh} refreshing={isLoading} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text style={styles.greeting}>Ayubowan, {firstName}!</Text>
            <Text style={styles.vehicleText}>
              {activeVehicle
                ? `${activeVehicle.make ?? activeVehicle.vehicleType} ${activeVehicle.model ?? ''} • ${activeVehicle.registrationNumber}`
                : 'Complete your driver and vehicle setup'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!profile || status === 'busy' || isUpdatingAvailability}
            onPress={toggleAvailability}
            style={[styles.statusChip, status === 'available' && styles.onlineChip]}>
            <View style={[styles.statusDot, status === 'available' && styles.onlineDot]} />
            <Text style={[styles.statusText, status === 'available' && styles.onlineText]}>
              {status === 'available' ? 'Online' : status === 'busy' ? 'Busy' : 'Offline'}
            </Text>
          </Pressable>
        </View>

        {!profile || !activeVehicle ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/driver/profile' as Href)}
            style={styles.setupBanner}>
            <View>
              <Text style={styles.setupTitle}>Complete Driver Setup</Text>
              <Text style={styles.setupText}>Add your license, base district and vehicle to accept jobs.</Text>
            </View>
            <Text style={styles.setupArrow}>›</Text>
          </Pressable>
        ) : null}

        {availabilityError ? <Text style={styles.errorText}>{availabilityError}</Text> : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>CURRENT DELIVERY VALUE</Text>
          <Text style={styles.summaryValue}>{activeJob ? formatLkr(activeJob.payoutAmount) : 'No active trip'}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryFooter}>
            <Text style={styles.summaryFooterText}>{availableJobs.length} jobs available</Text>
            <Text style={styles.summaryFooterText}>{myJobs.length} assigned trips</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(app)/driver/jobs' as Href)}
          style={styles.availableBanner}>
          <View style={styles.availableIcon}><Text style={styles.availableIconText}>!</Text></View>
          <View style={styles.availableCopy}>
            <Text style={styles.availableTitle}>{availableJobs.length} Available Jobs Nearby</Text>
            <Text style={styles.availableText}>{profile?.baseLocation.district ?? 'Sri Lanka'} delivery area</Text>
          </View>
          <Text style={styles.availableArrow}>›</Text>
        </Pressable>

        <View style={styles.metricsRow}>
          <Metric label="Vehicle Capacity" value={activeVehicle ? `${activeVehicle.capacityKg.toLocaleString('en-LK')} kg` : 'Not set'} />
          <Metric label="Pickup District" value={profile?.baseLocation.district ?? 'Not set'} />
          <Metric label="My Jobs" value={String(myJobs.length)} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{activeJob ? 'Current Scheduled Trip' : 'Available Delivery Job'}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/driver/jobs' as Href)}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {activeJob || availableJobs[0] ? (
          <DeliveryJobCard
            job={activeJob ?? availableJobs[0]}
            onPress={() =>
              router.push(`/driver/jobs/${(activeJob ?? availableJobs[0])._id}` as Href)
            }
          />
        ) : (
          <DriverDataState emptyMessage="New delivery jobs will appear here when farmers publish them." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { padding: 20, paddingBottom: 30 },
  greetingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  greetingCopy: { flex: 1, marginRight: 10 },
  greeting: { color: BrandColors.primary, fontSize: 21, fontWeight: '800' },
  vehicleText: { color: '#969996', fontSize: 11, marginTop: 4 },
  statusChip: { alignItems: 'center', backgroundColor: '#ECEEEC', borderRadius: 18, flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  onlineChip: { backgroundColor: BrandColors.primarySoft },
  statusDot: { backgroundColor: '#8E918E', borderRadius: 5, height: 9, width: 9 },
  onlineDot: { backgroundColor: BrandColors.primary },
  statusText: { color: '#686B68', fontSize: 11, fontWeight: '800' },
  onlineText: { color: BrandColors.primary },
  setupBanner: { alignItems: 'center', backgroundColor: '#FFF5D8', borderRadius: 13, flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, padding: 14 },
  setupTitle: { color: '#875E00', fontSize: 13, fontWeight: '800' },
  setupText: { color: '#947D46', fontSize: 10, marginTop: 3, maxWidth: 275 },
  setupArrow: { color: '#875E00', fontSize: 25 },
  errorText: { color: BrandColors.danger, fontSize: 11, marginTop: 10, textAlign: 'center' },
  summaryCard: { backgroundColor: BrandColors.primary, borderRadius: 17, marginTop: 20, padding: 20 },
  summaryLabel: { color: '#C9ECD6', fontSize: 10, fontWeight: '700' },
  summaryValue: { color: BrandColors.white, fontSize: 27, fontWeight: '800', marginTop: 13 },
  summaryDivider: { backgroundColor: '#37A765', height: 1, marginVertical: 17 },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryFooterText: { color: '#D9F3E3', fontSize: 10 },
  availableBanner: { alignItems: 'center', backgroundColor: BrandColors.primarySoft, borderRadius: 13, flexDirection: 'row', marginTop: 16, padding: 14 },
  availableIcon: { alignItems: 'center', borderColor: BrandColors.primary, borderRadius: 13, borderWidth: 1, height: 26, justifyContent: 'center', width: 26 },
  availableIconText: { color: BrandColors.primary, fontWeight: '800' },
  availableCopy: { flex: 1, marginLeft: 11 },
  availableTitle: { color: BrandColors.primary, fontSize: 12, fontWeight: '800' },
  availableText: { color: '#728072', fontSize: 10, marginTop: 3 },
  availableArrow: { color: BrandColors.primary, fontSize: 25 },
  metricsRow: { flexDirection: 'row', gap: 9, marginTop: 16 },
  metricCard: { backgroundColor: BrandColors.white, borderColor: BrandColors.border, borderRadius: 12, borderWidth: 1, flex: 1, padding: 11 },
  metricLabel: { color: '#999C99', fontSize: 9 },
  metricValue: { color: '#484B48', fontSize: 12, fontWeight: '800', marginTop: 8 },
  sectionRow: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11, marginTop: 22 },
  sectionTitle: { color: '#444744', fontSize: 15, fontWeight: '800' },
  viewAll: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
});
