import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getMarketplaceProducts } from '@/services/marketplace-service';
import type { MarketplaceFilters, MarketplaceProduct } from '@/types/marketplace';

type ProductState = {
  products: MarketplaceProduct[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

export function useMarketplaceProducts(filters: MarketplaceFilters, delay = 0) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<ProductState>({
    products: [],
    total: 0,
    isLoading: true,
    error: null,
  });
  const filterKey = JSON.stringify(filters);
  const stableFilters = useMemo<MarketplaceFilters>(() => JSON.parse(filterKey), [filterKey]);

  useEffect(() => {
    let isActive = true;

    const timeout = setTimeout(async () => {
      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const result = await getMarketplaceProducts(stableFilters);
        if (isActive) {
          setState({
            products: result.products,
            total: result.pagination.total,
            isLoading: false,
            error: null,
          });
        }
      } catch (requestError) {
        if (isActive) {
          setState((current) => ({
            ...current,
            isLoading: false,
            error: getApiErrorMessage(requestError),
          }));
        }
      }
    }, delay);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [delay, refreshKey, stableFilters]);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return { ...state, refresh };
}
