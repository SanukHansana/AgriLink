import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { getApiErrorMessage } from '@/services/api';
import { getDriverJobs, getDriverProfile, getDriverVehicles } from '@/services/driver-service';
import type { DeliveryJob, DriverProfile, DriverVehicle } from '@/types/logistics';

export function useDriverOverview() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>([]);
  const [myJobs, setMyJobs] = useState<DeliveryJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    setIsLoading(true);
    const loadOverview = async () => {
      try {
        const [profileResult, vehicleResult, availableResult, mineResult] = await Promise.all([
          getDriverProfile(),
          getDriverVehicles(),
          getDriverJobs({ scope: 'available' }),
          getDriverJobs({ scope: 'mine' }),
        ]);
        if (isActive) {
          setProfile(profileResult);
          setVehicles(vehicleResult.vehicles);
          setAvailableJobs(availableResult.jobs);
          setMyJobs(mineResult.jobs);
          setError(null);
        }
      } catch (requestError) {
        if (isActive) setError(getApiErrorMessage(requestError));
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadOverview();
    return () => {
      isActive = false;
    };
  // Recreate the focus callback when a manual refresh is requested.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]));

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { availableJobs, error, isLoading, myJobs, profile, refresh, vehicles };
}
