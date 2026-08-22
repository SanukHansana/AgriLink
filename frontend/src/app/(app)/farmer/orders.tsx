import { SafeAreaView } from 'react-native-safe-area-context';

import { FarmerState } from '@/components/farmer/farmer-state';

export default function FarmerOrdersPlaceholder() {
  return <SafeAreaView style={{ flex: 1 }}><FarmerState emptyMessage="Farmer bids and order management arrive in Stage 3." /></SafeAreaView>;
}
