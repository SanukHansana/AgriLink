import { Button } from '@/components/button';
import { useBuyerProfile } from '@/hooks/use-buyer-profile';
import type { DeliveryLocation } from '@/types/buyer-profile';

export function SavedDeliveryButton({ onSelect }: { onSelect: (location: DeliveryLocation) => void }) {
  const { profile } = useBuyerProfile();
  const location = profile?.deliveryLocations.find((item) => item.isDefault) ?? profile?.deliveryLocations[0];
  if (!location) return null;
  return <Button title="Use my saved delivery location" onPress={() => onSelect(location)} />;
}
