import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getOfficerNotices } from '@/services/advisory-service';
import type { AdvisoryNotice } from '@/types/advisory';

export function useAdvisoryNotices(status?: AdvisoryNotice['status']) {
  const [notices, setNotices] = useState<AdvisoryNotice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getOfficerNotices(status)
      .then((result) => {
        if (active) { setNotices(result); setError(null); }
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [refreshKey, status]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { error, isLoading, notices, refresh, setNotices };
}
