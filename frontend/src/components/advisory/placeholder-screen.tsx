import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';

export function AdvisoryPlaceholderScreen({ description, title }: { description: string; title: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>Coming in the next advisory stage</Text></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#FAFCFA', flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: BrandColors.primary, fontSize: 24, fontWeight: '800' },
  description: { color: '#777A77', fontSize: 14, lineHeight: 21, marginTop: 9 },
  badge: { alignSelf: 'flex-start', backgroundColor: BrandColors.primarySoft, borderRadius: 16, marginTop: 18, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { color: BrandColors.primary, fontSize: 11, fontWeight: '800' },
});
