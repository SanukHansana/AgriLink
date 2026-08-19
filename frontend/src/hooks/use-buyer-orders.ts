import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getBuyerOrders } from '@/services/order-service';
import type { BuyerOrder } from '@/types/transactions';

export function useBuyerOrders() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadOrders = async () => {
      try {
        const result = await getBuyerOrders();
        if (isActive) {
          setOrders(result.orders);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return { orders, error, isLoading, refresh };
}
