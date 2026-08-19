import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getMarketplaceProduct } from '@/services/marketplace-service';
import type { MarketplaceProduct } from '@/types/marketplace';

export function useMarketplaceProduct(productId: string) {
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadProduct = async () => {
      try {
        const result = await getMarketplaceProduct(productId);
        if (isActive) {
          setProduct(result);
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

    loadProduct();
    return () => {
      isActive = false;
    };
  }, [productId, refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  return { product, error, isLoading, refresh };
}
