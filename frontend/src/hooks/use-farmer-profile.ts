import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getFarmerProfile } from '@/services/farmer-service';
import type { FarmerProfile } from '@/types/farmer';

export function useFarmerProfile() {
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    getFarmerProfile()
      .then((result) => {
        if (isActive) {
          setProfile(result);
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
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, profile, refresh };
}
