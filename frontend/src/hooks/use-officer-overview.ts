import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import {
  getAssistanceRequests,
  getOfficerNotices,
  getOfficerProfile,
} from '@/services/advisory-service';
import type { AdvisoryNotice, AssistanceRequest, OfficerProfile } from '@/types/advisory';

export function useOfficerOverview() {
  const [profile, setProfile] = useState<OfficerProfile | null>(null);
  const [requests, setRequests] = useState<AssistanceRequest[]>([]);
  const [notices, setNotices] = useState<AdvisoryNotice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    Promise.all([getOfficerProfile(), getAssistanceRequests(), getOfficerNotices()])
      .then(([profileResult, requestResult, noticeResult]) => {
        if (!isActive) return;
        setProfile(profileResult);
        setRequests(requestResult);
        setNotices(noticeResult);
        setError(null);
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

  return { error, isLoading, notices, profile, refresh, requests };
}
