import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getBuyerBids } from '@/services/bid-service';
import type { BidStatus, BuyerBid } from '@/types/transactions';

export function useBuyerBids(status?: BidStatus) {
  const [bids, setBids] = useState<BuyerBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadBids = async () => {
      try {
        const result = await getBuyerBids(status);
        if (isActive) {
          setBids(result.bids);
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

    loadBids();
    return () => {
      isActive = false;
    };
  }, [refreshKey, status]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return { bids, error, isLoading, refresh };
}
