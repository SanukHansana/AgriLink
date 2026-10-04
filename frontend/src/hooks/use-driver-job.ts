import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getApiErrorMessage } from '@/services/api';
import { getDriverJob } from '@/services/driver-service';
import type { DeliveryJob } from '@/types/logistics';

export function useDriverJob(jobId?: string) {
  const [job, setJob] = useState<DeliveryJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    const loadJob = async () => {
      if (!jobId) {
        setError('Delivery job ID is missing.');
        setIsLoading(false);
        return;
      }
      try {
        const result = await getDriverJob(jobId);
        if (isActive) {
          setJob(result);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) setError(getApiErrorMessage(requestError));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadJob();
    return () => {
      isActive = false;
    };
  // Recreate the focus callback when a manual refresh is requested.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, refreshKey]));

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, job, refresh, setJob };
}
