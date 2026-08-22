import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getCooperatives } from '@/services/farmer-service';
import type { Cooperative } from '@/types/farmer';

export function useCooperatives() {
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getCooperatives().then((result) => { if (active) { setCooperatives(result.cooperatives); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { cooperatives, error, isLoading, refresh, setCooperatives };
}
