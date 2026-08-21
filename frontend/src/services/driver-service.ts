import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type {
  DeliveryJob,
  DeliveryJobStatus,
  DeliveryIssue,
  DeliveryIssueInput,
  DeliveryStatusInput,
  DriverEarningsData,
  DriverAvailabilityStatus,
  DriverProfile,
  DriverProfileInput,
  DriverVehicle,
  DriverVehicleInput,
} from '@/types/logistics';

export async function getDriverProfile() {
  try {
    const response = await api.get<{ profile: DriverProfile }>('/drivers/profile');
    return response.data.profile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function createDriverProfile(input: DriverProfileInput) {
  const response = await api.post<{ message: string; profile: DriverProfile }>(
    '/drivers/profile',
    input,
  );
  return response.data.profile;
}

export async function updateDriverProfile(
  input: Partial<DriverProfileInput> & { availabilityStatus?: DriverAvailabilityStatus },
) {
  const response = await api.patch<{ message: string; profile: DriverProfile }>(
    '/drivers/profile',
    input,
  );
  return response.data.profile;
}

export async function getDriverVehicles() {
  const response = await api.get<{ count: number; vehicles: DriverVehicle[] }>('/drivers/vehicles');
  return response.data;
}

export async function createDriverVehicle(input: DriverVehicleInput) {
  const response = await api.post<{ message: string; vehicle: DriverVehicle }>(
    '/drivers/vehicles',
    input,
  );
  return response.data.vehicle;
}

export async function getDriverJobs(input: {
  scope?: 'available' | 'mine';
  district?: string;
  status?: DeliveryJobStatus;
} = {}) {
  const response = await api.get<{ count: number; jobs: DeliveryJob[] }>('/drivers/jobs', {
    params: input,
  });
  return response.data;
}

export async function getDriverJob(jobId: string) {
  const response = await api.get<{ job: DeliveryJob }>(`/drivers/jobs/${jobId}`);
  return response.data.job;
}

export async function acceptDriverJob(jobId: string, vehicleId: string) {
  const response = await api.post<{ message: string; job: DeliveryJob }>(
    `/drivers/jobs/${jobId}/accept`,
    { vehicleId },
  );
  return response.data;
}

export async function updateDriverJobStatus(jobId: string, input: DeliveryStatusInput) {
  const response = await api.patch<{ message: string; job: DeliveryJob }>(
    `/drivers/jobs/${jobId}/status`,
    input,
  );
  return response.data;
}

export async function getDriverEarnings() {
  const response = await api.get<DriverEarningsData>('/drivers/earnings');
  return response.data;
}

export async function getDriverIssues() {
  const response = await api.get<{ count: number; issues: DeliveryIssue[] }>('/drivers/issues');
  return response.data;
}

export async function createDriverIssue(input: DeliveryIssueInput) {
  const response = await api.post<{ issue: DeliveryIssue; message: string }>(
    '/drivers/issues',
    input,
  );
  return response.data;
}
