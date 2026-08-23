import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import { getQualityGuidelines, getSurplusAdvisories } from '@/services/advisory-service';
import type { QualityGuideline, SurplusAdvisory } from '@/types/advisory';

export function useQualityGuidelines() {
  const [guidelines, setGuidelines] = useState<QualityGuideline[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getQualityGuidelines('active').then((result) => { if (active) { setGuidelines(result); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { error, guidelines, isLoading, refresh, setGuidelines };
}

export function useSurplusAdvisories() {
  const [advisories, setAdvisories] = useState<SurplusAdvisory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    getSurplusAdvisories('active').then((result) => { if (active) { setAdvisories(result); setError(null); } }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError)); }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);
  const refresh = useCallback(() => { setIsLoading(true); setRefreshKey((value) => value + 1); }, []);
  return { advisories, error, isLoading, refresh, setAdvisories };
}
