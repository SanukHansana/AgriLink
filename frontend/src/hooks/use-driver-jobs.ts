import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getDriverJobs } from '@/services/driver-service';
import type { DeliveryJob } from '@/types/logistics';

export function useDriverJobs(scope: 'available' | 'mine' = 'available') {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    const loadJobs = async () => {
      try {
        const result = await getDriverJobs({ scope });
        if (isActive) {
          setJobs(result.jobs);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) setError(getApiErrorMessage(requestError));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadJobs();
    return () => {
      isActive = false;
    };
  }, [refreshKey, scope]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, jobs, refresh };
}
