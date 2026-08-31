import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getPurchaseRequests } from '@/services/purchase-request-service';
import type { PurchaseRequest, PurchaseRequestStatus } from '@/types/purchase-request';

export function usePurchaseRequests(status?: PurchaseRequestStatus) {
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    getPurchaseRequests(status)
      .then((items) => {
        if (isActive) {
          setPurchaseRequests(items);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isActive) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => { isActive = false; };
  }, [refreshKey, status]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, purchaseRequests, refresh };
}
