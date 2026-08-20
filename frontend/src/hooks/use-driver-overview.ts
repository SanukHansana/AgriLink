import { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    let isActive = true;
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
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  return { availableJobs, error, isLoading, myJobs, profile, refresh, vehicles };
}
