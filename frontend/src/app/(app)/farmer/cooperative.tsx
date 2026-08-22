import { SafeAreaView } from 'react-native-safe-area-context';

import { FarmerState } from '@/components/farmer/farmer-state';

export default function FarmerCooperativePlaceholder() {
  return <SafeAreaView style={{ flex: 1 }}><FarmerState emptyMessage="Cooperative and shared-pickup functions arrive in Stage 4." /></SafeAreaView>;
}
