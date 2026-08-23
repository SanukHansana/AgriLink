import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getAssistanceRequest } from '@/services/advisory-service';
import type { AssistanceRequest } from '@/types/advisory';

export function useAssistanceRequest(requestId?: string) {
  const [request, setRequest] = useState<AssistanceRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    if (!requestId) {
      setError('Assistance request ID is missing.');
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }
    getAssistanceRequest(requestId)
      .then((result) => {
        if (isActive) {
          setRequest(result);
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
  }, [refreshKey, requestId]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, refresh, request, setRequest };
}
