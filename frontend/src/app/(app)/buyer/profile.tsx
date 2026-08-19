import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/contexts/auth-context';
import { useBuyerOrders } from '@/hooks/use-buyer-orders';
import { useBuyerProfile } from '@/hooks/use-buyer-profile';
import { BUYER_TYPES, type BuyerType, type DeliveryLocation } from '@/types/buyer-profile';
import { formatLkr } from '@/utils/formatters';

const buyerTypeLabels: Record<BuyerType, string> = {
  individual: 'Individual',
  retailer: 'Retailer',
  wholesaler: 'Wholesaler',
  restaurant: 'Restaurant',
  exporter: 'Exporter',
  processor: 'Processor',
};

export default function BuyerProfileScreen() {
  const { logout, user } = useAuth();
  const {
    error: profileError,
    isLoading: isProfileLoading,
    isSaving,
    profile,
    refresh: refreshProfile,
    saveProfile,
  } = useBuyerProfile();
  const { error: ordersError, isLoading: isOrdersLoading, orders } = useBuyerOrders();
  const [isEditing, setIsEditing] = useState(false);
  const [buyerType, setBuyerType] = useState<BuyerType>('individual');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const primaryLocation = useMemo(
    () => profile?.deliveryLocations.find((location) => location.isDefault) ?? profile?.deliveryLocations[0],
    [profile],
  );

  useEffect(() => {
    if (profile) {
      setBuyerType(profile.buyerType);
      setBusinessName(profile.businessName ?? '');
      setPhone(profile.phone);
      setAddressLine(primaryLocation?.addressLine ?? '');
      setCity(primaryLocation?.city ?? '');
      setDistrict(primaryLocation?.district ?? '');
      setPostalCode(primaryLocation?.postalCode ?? '');
      return;
    }

    if (!isProfileLoading) {
      setIsEditing(true);
    }
  }, [isProfileLoading, primaryLocation, profile]);

  if (!user) {
    return null;
  }

  if (isProfileLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BuyerDataState isLoading loadingMessage="Loading your profile…" />
      </SafeAreaView>
    );
  }

  if (profileError && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BuyerDataState error={profileError} onRetry={refreshProfile} />
      </SafeAreaView>
    );
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const validOrders = orders.filter((order) => order.status !== 'cancelled');
  const totalSpent = validOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const memberSince = new Intl.DateTimeFormat('en-LK', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(user.createdAt));

  const handleSave = async () => {
    setFormError(null);
    setSuccessMessage(null);

    if (!phone.trim() || !addressLine.trim() || !city.trim() || !district.trim()) {
      setFormError('Phone, address, city and district are required.');
      return;
    }

    const editedLocation: DeliveryLocation = {
      ...primaryLocation,
      label: primaryLocation?.label || 'Primary',
      addressLine: addressLine.trim(),
      city: city.trim(),
      district: district.trim(),
      postalCode: postalCode.trim() || undefined,
      isDefault: true,
    };
    const deliveryLocations = profile?.deliveryLocations.length
      ? profile.deliveryLocations.map((location) =>
          location === primaryLocation ? editedLocation : { ...location, isDefault: false },
        )
      : [editedLocation];

    try {
      await saveProfile({
        buyerType,
        businessName: businessName.trim() || undefined,
        phone: phone.trim(),
        deliveryLocations,
      });
      setIsEditing(false);
      setSuccessMessage('Profile saved successfully.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save your profile.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.memberSince}>Member since {memberSince}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ORDERS PLACED</Text>
            <Text style={styles.statValue}>{isOrdersLoading ? '...' : validOrders.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ORDER VALUE</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              {isOrdersLoading ? 'LKR ...' : formatLkr(totalSpent)}
            </Text>
          </View>
        </View>

        {ordersError ? <Text style={styles.inlineWarning}>{ordersError}</Text> : null}
        {successMessage ? <Text style={styles.successMessage}>{successMessage}</Text> : null}

        {isEditing ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>{profile ? 'Edit Buyer Profile' : 'Complete Buyer Profile'}</Text>
            <Text style={styles.fieldLabel}>Buyer Type</Text>
            <View style={styles.typeOptions}>
              {BUYER_TYPES.map((type) => {
                const selected = type === buyerType;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={type}
                    onPress={() => setBuyerType(type)}
                    style={[styles.typeOption, selected && styles.selectedTypeOption]}>
                    <Text style={[styles.typeOptionText, selected && styles.selectedTypeOptionText]}>
                      {buyerTypeLabels[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <ProfileInput
              label="Business Name (optional)"
              onChangeText={setBusinessName}
              placeholder="Business or organization name"
              value={businessName}
            />
            <ProfileInput
              keyboardType="phone-pad"
              label="Phone Number"
              onChangeText={setPhone}
              placeholder="0771234567"
              value={phone}
            />
            <ProfileInput
              label="Primary Delivery Address"
              onChangeText={setAddressLine}
              placeholder="House number and street"
              value={addressLine}
            />
            <View style={styles.twoColumnFields}>
              <View style={styles.flexField}>
                <ProfileInput label="City" onChangeText={setCity} placeholder="Colombo" value={city} />
              </View>
              <View style={styles.flexField}>
                <ProfileInput
                  label="District"
                  onChangeText={setDistrict}
                  placeholder="Colombo"
                  value={district}
                />
              </View>
            </View>
            <ProfileInput
              keyboardType="number-pad"
              label="Postal Code (optional)"
              onChangeText={setPostalCode}
              placeholder="00300"
              value={postalCode}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <View style={styles.formActions}>
              {profile ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={handleSave}
                style={[styles.saveButton, isSaving && styles.disabledButton]}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save Profile'}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.settingsCard}>
            <ProfileRow
              label="Buyer Type"
              value={profile ? buyerTypeLabels[profile.buyerType] : 'Not set'}
            />
            <ProfileRow label="Phone Number" value={profile?.phone ?? 'Not set'} />
            <ProfileRow
              label="Saved Address"
              value={
                primaryLocation
                  ? `${primaryLocation.city}, ${primaryLocation.district}`
                  : 'No address saved'
              }
            />
            <ProfileRow label="Language Preferences" value="English" />
            <ProfileRow label="Alerts & Notifications" value="On" />
          </View>
        )}

        {!isEditing ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFormError(null);
              setSuccessMessage(null);
              setIsEditing(true);
            }}
            style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </Pressable>
        ) : null}

        <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileInput({
  keyboardType,
  label,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize="sentences"
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A1A4A1"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingValueRow}>
        <Text numberOfLines={1} style={styles.settingValue}>
          {value}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAF8',
    flex: 1,
  },
  content: {
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 15,
    paddingBottom: 22,
    paddingTop: 24,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: BrandColors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  profileCopy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: '#4A4C4A',
    fontSize: 20,
    fontWeight: '800',
  },
  email: {
    color: '#7E827E',
    fontSize: 12,
  },
  memberSince: {
    color: '#A0A3A0',
    fontSize: 11,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    backgroundColor: BrandColors.white,
    borderRadius: 14,
    flex: 1,
    gap: 7,
    padding: 14,
  },
  statLabel: {
    color: '#A0A3A0',
    fontSize: 9,
  },
  statValue: {
    color: '#4A4C4A',
    fontSize: 16,
    fontWeight: '800',
  },
  statValueGreen: {
    color: BrandColors.primary,
  },
  inlineWarning: {
    color: BrandColors.warning,
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  successMessage: {
    color: BrandColors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 22,
    padding: 15,
  },
  sectionTitle: {
    color: '#4A4D4A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 15,
  },
  field: {
    marginTop: 13,
  },
  fieldLabel: {
    color: '#555855',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    borderColor: BrandColors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: '#404340',
    fontSize: 13,
    minHeight: 45,
    paddingHorizontal: 12,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  typeOption: {
    backgroundColor: BrandColors.primarySurface,
    borderColor: BrandColors.primarySoft,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  selectedTypeOption: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  typeOptionText: {
    color: BrandColors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  selectedTypeOptionText: {
    color: BrandColors.white,
  },
  twoColumnFields: {
    flexDirection: 'row',
    gap: 9,
  },
  flexField: {
    flex: 1,
  },
  formError: {
    color: BrandColors.danger,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 17,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: BrandColors.primary,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 45,
  },
  cancelButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primary,
    borderRadius: 22,
    flex: 2,
    justifyContent: 'center',
    minHeight: 45,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: BrandColors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  settingsCard: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 13,
    borderWidth: 1,
    marginTop: 28,
    overflow: 'hidden',
  },
  settingRow: {
    alignItems: 'center',
    borderBottomColor: BrandColors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 13,
  },
  settingLabel: {
    color: '#555755',
    fontSize: 13,
    fontWeight: '700',
  },
  settingValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    maxWidth: '53%',
  },
  settingValue: {
    color: '#999C99',
    flexShrink: 1,
    fontSize: 11,
  },
  chevron: {
    color: '#999C99',
    fontSize: 20,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 23,
    marginTop: 18,
    paddingVertical: 13,
  },
  editButtonText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 23,
  },
  logoutText: {
    color: BrandColors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
