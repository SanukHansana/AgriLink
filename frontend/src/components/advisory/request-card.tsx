import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import type { AssistanceRequest } from '@/types/advisory';

const priorityColors = {
  high: { background: '#FFE4E4', text: BrandColors.danger },
  medium: { background: '#FFF0C9', text: BrandColors.warning },
  low: { background: '#ECEEEC', text: '#626562' },
};

const statusColors: Record<AssistanceRequest['status'], { background: string; text: string }> = {
  pending: { background: '#FFF0C9', text: BrandColors.warning },
  inReview: { background: '#DCEAFF', text: '#2563D9' },
  approved: { background: BrandColors.primarySoft, text: BrandColors.primary },
  revisionRequired: { background: '#FFF0C9', text: BrandColors.warning },
  rejected: { background: '#FFE4E4', text: BrandColors.danger },
  resolved: { background: BrandColors.primarySoft, text: BrandColors.primary },
};

export function RequestCard({
  onPress,
  request,
}: {
  onPress: () => void;
  request: AssistanceRequest;
}) {
  const priority = priorityColors[request.priority];
  const status = statusColors[request.status];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Text numberOfLines={1} style={styles.farmer}>
          {request.farmer.name}
        </Text>
        <View style={[styles.badge, { backgroundColor: priority.background }]}>
          <Text style={[styles.badgeText, { color: priority.text }]}>{capitalize(request.priority)}</Text>
        </View>
      </View>
      <Text style={styles.label}>Request Type</Text>
      <Text numberOfLines={2} style={styles.title}>{request.title}</Text>
      <View style={styles.footer}>
        <Text style={styles.date}>Submitted: {new Date(request.createdAt).toLocaleDateString('en-LK')}</Text>
        <View style={[styles.badge, { backgroundColor: status.background }]}>
          <Text style={[styles.badgeText, { color: status.text }]}>{statusLabel(request.status)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusLabel(status: AssistanceRequest['status']) {
  const labels: Record<AssistanceRequest['status'], string> = {
    pending: 'Pending',
    inReview: 'In Review',
    approved: 'Approved',
    revisionRequired: 'Revision',
    rejected: 'Rejected',
    resolved: 'Resolved',
  };
  return labels[status];
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    borderColor: BrandColors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 15,
  },
  pressed: { opacity: 0.75 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  farmer: { color: '#414441', flex: 1, fontSize: 13, fontWeight: '800', marginRight: 10 },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 8, fontWeight: '800' },
  label: { color: '#999C99', fontSize: 9, marginTop: 13 },
  title: { color: BrandColors.primary, fontSize: 13, fontWeight: '800', marginTop: 4 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 13 },
  date: { color: '#999C99', fontSize: 9 },
});
