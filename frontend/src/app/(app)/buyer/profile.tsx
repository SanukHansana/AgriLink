import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const settings = [
  ['Saved Addresses', 'Home, Office'],
  ['Language Preferences', 'English'],
  ['Alerts & Notifications', 'On'],
  ['Help Center / Support', ''],
];

export default function BuyerProfileScreen() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ORDERS PLACED</Text>
          <Text style={styles.statValue}>—</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL SPENT</Text>
          <Text style={[styles.statValue, styles.statValueGreen]}>LKR —</Text>
        </View>
      </View>

      <View style={styles.settingsCard}>
        {settings.map(([label, value], index) => (
          <View
            key={label}
            style={[styles.settingRow, index < settings.length - 1 && styles.settingBorder]}>
            <Text style={styles.settingLabel}>{label}</Text>
            <View style={styles.settingValueRow}>
              <Text style={styles.settingValue}>{value}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout Account</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F8FAF8',
    flex: 1,
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
    gap: 4,
  },
  name: {
    color: '#4A4C4A',
    fontSize: 20,
    fontWeight: '800',
  },
  email: {
    color: '#929592',
    fontSize: 13,
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
    fontSize: 10,
  },
  statValue: {
    color: '#4A4C4A',
    fontSize: 17,
    fontWeight: '800',
  },
  statValueGreen: {
    color: BrandColors.primary,
  },
  settingsCard: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderWidth: 1,
    marginTop: 38,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 13,
  },
  settingBorder: {
    borderBottomColor: BrandColors.border,
    borderBottomWidth: 1,
  },
  settingLabel: {
    color: '#555755',
    fontSize: 14,
    fontWeight: '700',
  },
  settingValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  settingValue: {
    color: '#999C99',
    fontSize: 12,
  },
  chevron: {
    color: '#999C99',
    fontSize: 21,
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 26,
  },
  logoutText: {
    color: BrandColors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
});
