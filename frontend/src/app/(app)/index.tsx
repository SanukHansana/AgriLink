import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import type { UserRole } from '@/types/auth';

const roleContent: Record<UserRole, { title: string; description: string }> = {
  farmer: {
    title: 'Farmer workspace',
    description: 'Manage your farm profile, harvests, products, bids and cooperative activity.',
  },
  buyer: {
    title: 'Buyer marketplace',
    description: 'Discover Sri Lankan produce, place bids and manage market orders.',
  },
  driver: {
    title: 'Delivery workspace',
    description: 'Find delivery jobs, manage collections and update delivery progress.',
  },
  agricultureOfficer: {
    title: 'Agriculture advisory',
    description: 'Respond to farmers, publish guidance and review agricultural listings.',
  },
};

export default function RoleHomeScreen() {
  const { logout, user } = useAuth();

  if (!user) {
    return null;
  }

  const content = roleContent[user.role];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>AYUBOWAN</Text>
        <Text style={styles.greeting}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{content.title}</Text>
        </View>
        <Text style={styles.title}>Your AgriLink account is ready</Text>
        <Text style={styles.description}>{content.description}</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Connected to the shared foundation</Text>
            <Text style={styles.statusDescription}>
              Role-specific features will appear here as each project stage is completed.
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={logout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BrandColors.white,
    flex: 1,
  },
  header: {
    backgroundColor: BrandColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  eyebrow: {
    color: '#C7EBD5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  greeting: {
    color: BrandColors.white,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 7,
  },
  email: {
    color: '#DDF1E5',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: BrandColors.primarySoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  roleBadgeText: {
    color: BrandColors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#343434',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
  },
  description: {
    color: '#777A78',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  statusCard: {
    borderColor: BrandColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    padding: 16,
  },
  statusDot: {
    backgroundColor: BrandColors.primary,
    borderRadius: 6,
    height: 12,
    marginTop: 4,
    width: 12,
  },
  statusCopy: {
    flex: 1,
    gap: 5,
  },
  statusTitle: {
    color: '#343434',
    fontSize: 15,
    fontWeight: '800',
  },
  statusDescription: {
    color: '#8E918F',
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: BrandColors.danger,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 'auto',
    minHeight: 50,
  },
  logoutPressed: {
    backgroundColor: '#FEECEC',
  },
  logoutText: {
    color: BrandColors.danger,
    fontSize: 15,
    fontWeight: '800',
  },
});
