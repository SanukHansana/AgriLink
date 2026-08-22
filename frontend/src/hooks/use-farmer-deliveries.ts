import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerDeliveryJobs } from '@/services/farmer-service';
import type { DeliveryJob } from '@/types/logistics';

export function useFarmerDeliveries() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getFarmerDeliveryJobs().then((result) => { if (active) { setJobs(result.jobs); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, isLoading, jobs, refresh };
}
