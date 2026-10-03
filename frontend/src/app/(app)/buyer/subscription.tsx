import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionPanel } from '@/components/buyer/subscription-panel';
import { BrandColors } from '@/constants/theme';

export default function SubscriptionScreen() {
  const router = useRouter();
  return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FAFCFA' }}><ScrollView>
    <View style={{ paddingHorizontal: 24, paddingTop: 16, gap: 12, width: '100%', maxWidth: 880, alignSelf: 'center' }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to buyer home" onPress={() => router.replace('/(app)/buyer')}><Text style={{ color: BrandColors.primary, fontWeight: '700' }}>‹ Back to Home</Text></Pressable>
      <Text style={{ color: BrandColors.primary, fontSize: 26, fontWeight: '800' }}>AgriLink</Text>
    </View>
    <SubscriptionPanel />
  </ScrollView></SafeAreaView>;
}
