import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerOrders } from '@/services/farmer-service';
import type { BuyerOrder } from '@/types/transactions';

export function useFarmerOrders() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getFarmerOrders().then((result) => { if (active) { setOrders(result.orders); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, isLoading, orders, refresh, setOrders };
}
