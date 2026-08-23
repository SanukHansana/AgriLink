import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getAssistanceRequests } from '@/services/advisory-service';
import type { AssistanceRequest, AssistanceRequestStatus } from '@/types/advisory';

export function useAssistanceRequests(status?: AssistanceRequestStatus) {
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    getAssistanceRequests({ status })
      .then((result) => {
        if (isActive) {
          setRequests(result);
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
  }, [refreshKey, status]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, refresh, requests, setRequests };
}
