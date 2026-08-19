import { useCallback, useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/services/api';
import {
  createBuyerProfile,
  getBuyerProfile,
  updateBuyerProfile,
} from '@/services/buyer-profile-service';
import type { BuyerProfile, BuyerProfileInput } from '@/types/buyer-profile';

export function useBuyerProfile() {
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const result = await getBuyerProfile();
        if (isActive) {
          setProfile(result);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) {
          setError(getApiErrorMessage(requestError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((current) => current + 1);
  }, []);

  const saveProfile = useCallback(
    async (input: BuyerProfileInput) => {
      setIsSaving(true);
      setError(null);
      try {
        const savedProfile = profile
          ? await updateBuyerProfile(input)
          : await createBuyerProfile(input);
        setProfile(savedProfile);
        return savedProfile;
      } catch (requestError) {
        const message = getApiErrorMessage(requestError);
        setError(message);
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [profile],
  );

  return { profile, error, isLoading, isSaving, refresh, saveProfile };
}
