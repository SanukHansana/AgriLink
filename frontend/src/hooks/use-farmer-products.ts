import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerProducts } from '@/services/farmer-service';
import type { ListingType, MarketplaceProduct } from '@/types/marketplace';

export function useFarmerProducts(listingType?: ListingType) {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    getFarmerProducts({ listingType })
      .then((result) => {
        if (isActive) {
          setProducts(result.products);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (isActive) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [listingType, refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, products, refresh };
}
