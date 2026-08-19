import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type { BuyerProfile, BuyerProfileInput } from '@/types/buyer-profile';

export async function getBuyerProfile() {
  try {
    const response = await api.get<{ profile: BuyerProfile }>('/buyers/profile');
    return response.data.profile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function createBuyerProfile(input: BuyerProfileInput) {
  const response = await api.post<{ message: string; profile: BuyerProfile }>(
    '/buyers/profile',
    input,
  );
  return response.data.profile;
}

export async function updateBuyerProfile(input: BuyerProfileInput) {
  const response = await api.patch<{ message: string; profile: BuyerProfile }>(
    '/buyers/profile',
    input,
  );
  return response.data.profile;
}
