import { SafeAreaView } from 'react-native-safe-area-context';

import { DriverDataState } from '@/components/driver/driver-data-state';

export default function DriverActivePlaceholder() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DriverDataState emptyMessage="Active delivery navigation and status updates arrive in Stage 3." />
    </SafeAreaView>
  );
}
