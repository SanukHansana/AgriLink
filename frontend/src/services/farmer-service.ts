import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type { FarmerProductInput, FarmerProfile, FarmerProfileInput } from '@/types/farmer';
import type { ListingType, MarketplaceProduct } from '@/types/marketplace';

export async function getFarmerProfile() {
  try {
    const response = await api.get<{ profile: FarmerProfile }>('/farmers/profile');
    return response.data.profile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function createFarmerProfile(input: FarmerProfileInput) {
  const response = await api.post<{ message: string; profile: FarmerProfile }>(
    '/farmers/profile',
    input,
  );
  return response.data.profile;
}

export async function updateFarmerProfile(input: Partial<FarmerProfileInput>) {
  const response = await api.patch<{ message: string; profile: FarmerProfile }>(
    '/farmers/profile',
    input,
  );
  return response.data.profile;
}

export async function getFarmerProducts(filters: {
  listingType?: ListingType;
  status?: MarketplaceProduct['status'];
} = {}) {
  const response = await api.get<{ count: number; products: MarketplaceProduct[] }>(
    '/farmers/products',
    { params: filters },
  );
  return response.data;
}

export async function getFarmerProduct(productId: string) {
  const response = await api.get<{ product: MarketplaceProduct }>(
    `/farmers/products/${productId}`,
  );
  return response.data.product;
}

export async function createFarmerProduct(input: FarmerProductInput) {
  const response = await api.post<{ message: string; product: MarketplaceProduct }>(
    '/farmers/products',
    input,
  );
  return response.data.product;
}

export async function updateFarmerProduct(productId: string, input: Partial<FarmerProductInput>) {
  const response = await api.patch<{ message: string; product: MarketplaceProduct }>(
    `/farmers/products/${productId}`,
    input,
  );
  return response.data.product;
}

export async function deactivateFarmerProduct(productId: string) {
  const response = await api.delete<{ message: string; product: MarketplaceProduct }>(
    `/farmers/products/${productId}`,
  );
  return response.data.product;
}
