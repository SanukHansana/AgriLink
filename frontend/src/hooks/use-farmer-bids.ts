import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerBids } from '@/services/farmer-service';
import type { BuyerBid } from '@/types/transactions';

export function useFarmerBids() {
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getFarmerBids().then((result) => { if (active) { setBids(result.bids); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { bids, error, isLoading, refresh, setBids };
}
