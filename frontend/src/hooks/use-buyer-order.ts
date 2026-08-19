import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getBuyerOrder } from '@/services/order-service';
import type { BuyerOrder } from '@/types/transactions';

export function useBuyerOrder(orderId?: string) {
  const [order, setOrder] = useState<BuyerOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        const result = await getBuyerOrder(orderId);
        if (isActive) {
          setOrder(result.order);
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

    loadOrder();
    return () => {
      isActive = false;
    };
  }, [orderId, refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return { order, error, isLoading, refresh };
}
