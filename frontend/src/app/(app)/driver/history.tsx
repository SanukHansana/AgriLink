import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';

export default function DriverHistoryPlaceholder() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DriverDataState emptyMessage="Delivery history and earnings arrive in Stage 4." />
    </SafeAreaView>
  );
}
