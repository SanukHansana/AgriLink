import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerOrders } from '@/services/farmer-service';
import type { BuyerOrder } from '@/types/transactions';

export function useFarmerOrders() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try { const result = await getFarmerOrders(); if (active) { setOrders(result.orders); setError(null); } }
      catch (requestError) { if (active) setError(getApiErrorMessage(requestError)); }
      finally { loading = false; if (active) setIsLoading(false); }
    };
    void load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  // Manual refresh intentionally reruns the focused loader.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]));
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, isLoading, orders, refresh, setOrders };
}
