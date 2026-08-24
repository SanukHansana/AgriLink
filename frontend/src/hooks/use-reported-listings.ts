import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getReportedListings } from '@/services/advisory-service';
import type { ReportedListing } from '@/types/advisory';

export function useReportedListings(status?: ReportedListing['status']) {
  const [reports, setReports] = useState<ReportedListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getReportedListings({ status }).then((result) => { if (active) { setReports(result); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey, status]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, isLoading, refresh, reports, setReports };
}
