import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SubscriptionPanel } from '@/components/buyer/subscription-panel';

export default function SubscriptionScreen() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}><ScrollView><SubscriptionPanel /></ScrollView></SafeAreaView>;
}
