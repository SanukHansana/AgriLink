import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/auth/form-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { DriverDataState } from '@/components/driver/driver-data-state';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useDriverOverview } from '@/hooks/use-driver-overview';
import { getApiErrorMessage } from '@/services/api';
import { createDriverProfile, createDriverVehicle } from '@/services/driver-service';
import type { VehicleType } from '@/types/logistics';

const vehicleTypes: { label: string; value: VehicleType }[] = [
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Three-wheeler', value: 'threeWheeler' },
  { label: 'Van', value: 'van' },
  { label: 'Lorry', value: 'lorry' },
  { label: 'Refrigerated', value: 'refrigeratedTruck' },
  { label: 'Other', value: 'other' },
];

export default function DriverProfileScreen() {
  const { logout, user } = useAuth();
  const overview = useDriverOverview();
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('lorry');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);

  if (overview.isLoading && !overview.profile && overview.vehicles.length === 0) {
    return <DriverDataState isLoading />;
  }

  if (overview.error && !overview.profile) {
    return <DriverDataState error={overview.error} onRetry={overview.refresh} />;
  }

  const saveProfile = async () => {
    if (!phone.trim() || !licenseNumber.trim() || !licenseExpiryDate.trim() || !district.trim()) {
      setFormError('Phone, licence number, expiry date, and district are required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(licenseExpiryDate.trim())) {
      setFormError('Enter the licence expiry date as YYYY-MM-DD.');
      return;
    }

    setIsSavingProfile(true);
    setFormError(null);
    try {
      await createDriverProfile({
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: licenseExpiryDate.trim(),
        baseLocation: { city: city.trim() || undefined, district: district.trim() },
        availabilityStatus: 'available',
      });
      overview.refresh();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveVehicle = async () => {
    const parsedCapacity = Number(capacityKg);
    if (!registrationNumber.trim() || !Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      setFormError('Registration number and a valid capacity are required.');
      return;
    }

    setIsSavingVehicle(true);
    setFormError(null);
    try {
      await createDriverVehicle({
        vehicleType,
        registrationNumber: registrationNumber.trim(),
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        capacityKg: parsedCapacity,
        isRefrigerated: vehicleType === 'refrigeratedTruck',
      });
      overview.refresh();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSavingVehicle(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={overview.isLoading} onRefresh={overview.refresh} />
          }>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage driver and vehicle details</Text>

          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              {overview.profile ? (
                <Text style={styles.verified}>DRIVER PROFILE ACTIVE</Text>
              ) : (
                <Text style={styles.setupRequired}>SETUP REQUIRED</Text>
              )}
            </View>
          </View>

          {overview.profile ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Driver Details</Text>
              <InfoRow label="Phone" value={overview.profile.phone} />
              <InfoRow label="Licence" value={overview.profile.licenseNumber} />
              <InfoRow
                label="Licence expiry"
                value={new Date(overview.profile.licenseExpiryDate).toLocaleDateString()}
              />
              <InfoRow
                label="Base location"
                value={[overview.profile.baseLocation.city, overview.profile.baseLocation.district]
                  .filter(Boolean)
                  .join(', ')}
              />
              <InfoRow
                label="Availability"
                value={overview.profile.availabilityStatus.replace(/([A-Z])/g, ' $1')}
              />
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Complete Driver Setup</Text>
              <Text style={styles.sectionHint}>These details are required before accepting jobs.</Text>
              <FormField
                keyboardType="phone-pad"
                label="Phone number"
                onChangeText={setPhone}
                placeholder="077 123 4567"
                value={phone}
              />
              <FormField
                autoCapitalize="characters"
                label="Driving licence number"
                onChangeText={setLicenseNumber}
                placeholder="B1234567"
                value={licenseNumber}
              />
              <FormField
                label="Licence expiry date"
                onChangeText={setLicenseExpiryDate}
                placeholder="YYYY-MM-DD"
                value={licenseExpiryDate}
              />
              <FormField
                autoCapitalize="words"
                label="Base city (optional)"
                onChangeText={setCity}
                placeholder="Matale"
                value={city}
              />
              <FormField
                autoCapitalize="words"
                label="Base district"
                onChangeText={setDistrict}
                placeholder="Matale"
                value={district}
              />
              <PrimaryButton
                label="Save Driver Profile"
                loading={isSavingProfile}
                onPress={saveProfile}
              />
            </View>
          )}

          {overview.profile && overview.vehicles.length === 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Your Vehicle</Text>
              <Text style={styles.sectionHint}>Job capacity checks use the vehicle selected here.</Text>
              <Text style={styles.fieldLabel}>Vehicle type</Text>
              <View style={styles.choiceGrid}>
                {vehicleTypes.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setVehicleType(option.value)}
                    style={[
                      styles.choice,
                      vehicleType === option.value && styles.selectedChoice,
                    ]}>
                    <Text
                      style={[
                        styles.choiceText,
                        vehicleType === option.value && styles.selectedChoiceText,
                      ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <FormField
                autoCapitalize="characters"
                label="Registration number"
                onChangeText={setRegistrationNumber}
                placeholder="WP-LH 4821"
                value={registrationNumber}
              />
              <View style={styles.twoColumns}>
                <View style={styles.column}>
                  <FormField
                    autoCapitalize="words"
                    label="Make"
                    onChangeText={setMake}
                    placeholder="Tata"
                    value={make}
                  />
                </View>
                <View style={styles.column}>
                  <FormField
                    autoCapitalize="words"
                    label="Model"
                    onChangeText={setModel}
                    placeholder="Lorry"
                    value={model}
                  />
                </View>
              </View>
              <FormField
                keyboardType="numeric"
                label="Maximum capacity (kg)"
                onChangeText={setCapacityKg}
                placeholder="1500"
                value={capacityKg}
              />
              <PrimaryButton
                label="Save Vehicle"
                loading={isSavingVehicle}
                onPress={saveVehicle}
              />
            </View>
          ) : null}

          {overview.vehicles.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Registered Vehicles</Text>
              {overview.vehicles.map((vehicle) => (
                <View key={vehicle._id} style={styles.vehicleCard}>
                  <View>
                    <Text style={styles.vehicleName}>
                      {[vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
                        vehicle.vehicleType.replace(/([A-Z])/g, ' $1')}
                    </Text>
                    <Text style={styles.vehicleRegistration}>{vehicle.registrationNumber}</Text>
                  </View>
                  <View style={styles.capacityBadge}>
                    <Text style={styles.capacityText}>{vehicle.capacityKg.toLocaleString()} kg</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {formError ? <Text style={styles.error}>{formError}</Text> : null}

          <Pressable onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign Out Account</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: BrandColors.white, flex: 1 },
  keyboardView: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  title: { color: BrandColors.primary, fontSize: 21, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#919491', fontSize: 12, marginTop: 3 },
  identityCard: {
    borderColor: BrandColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 18,
    padding: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 29,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  avatarText: { color: BrandColors.primary, fontSize: 24, fontWeight: '800' },
  identityCopy: { flex: 1, justifyContent: 'center', marginLeft: 13 },
  name: { color: '#383B38', fontSize: 17, fontWeight: '800' },
  email: { color: '#929592', fontSize: 11, marginTop: 2 },
  verified: { color: BrandColors.primary, fontSize: 9, fontWeight: '800', marginTop: 5 },
  setupRequired: { color: BrandColors.warning, fontSize: 9, fontWeight: '800', marginTop: 5 },
  section: {
    borderColor: BrandColors.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 13,
    marginTop: 16,
    padding: 15,
  },
  sectionTitle: { color: '#3D403D', fontSize: 15, fontWeight: '800' },
  sectionHint: { color: '#8C8F8C', fontSize: 11, marginTop: -7 },
  infoRow: {
    borderBottomColor: BrandColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  infoLabel: { color: '#929592', fontSize: 11 },
  infoValue: { color: '#454845', flex: 1, fontSize: 12, fontWeight: '700', textAlign: 'right', textTransform: 'capitalize' },
  fieldLabel: { color: '#525552', fontSize: 14, fontWeight: '700' },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderColor: BrandColors.border, borderRadius: 16, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 7 },
  selectedChoice: { backgroundColor: BrandColors.primarySoft, borderColor: BrandColors.primary },
  choiceText: { color: '#666966', fontSize: 10, fontWeight: '700' },
  selectedChoiceText: { color: BrandColors.primary },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  vehicleCard: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySurface,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 13,
  },
  vehicleName: { color: '#414441', fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  vehicleRegistration: { color: '#8F928F', fontSize: 10, marginTop: 3 },
  capacityBadge: { backgroundColor: BrandColors.white, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  capacityText: { color: BrandColors.primary, fontSize: 10, fontWeight: '800' },
  error: { color: BrandColors.danger, fontSize: 12, marginTop: 13, textAlign: 'center' },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    marginTop: 18,
    paddingVertical: 14,
  },
  logoutText: { color: BrandColors.danger, fontSize: 13, fontWeight: '800' },
});
