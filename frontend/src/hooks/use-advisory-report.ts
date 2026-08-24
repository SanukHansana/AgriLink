import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getAdvisoryReportOverview } from '@/services/advisory-service';
import type { AdvisoryReportOverview } from '@/types/advisory';

export function useAdvisoryReport() {
  const [report, setReport] = useState<AdvisoryReportOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getAdvisoryReportOverview().then((result) => { if (active) { setReport(result); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, isLoading, refresh, report };
}
