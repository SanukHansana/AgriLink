import { isAxiosError } from 'axios';

import { api } from '@/services/api';
import type {
  Cooperative,
  CooperativeContributionInput,
  CooperativeInput,
  FarmerProductInput,
  FarmerProfile,
  FarmerProfileInput,
} from '@/types/farmer';
import type { DeliveryJob } from '@/types/logistics';
import type { ListingType, MarketplaceProduct } from '@/types/marketplace';
import type { BidStatus, BuyerBid, BuyerOrder, OrderStatus } from '@/types/transactions';

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

export async function getFarmerBids(filters: { productId?: string; status?: BidStatus } = {}) {
  const response = await api.get<{ count: number; bids: BuyerBid[] }>('/farmers/bids', {
    params: filters,
  });
  return response.data;
}

export async function updateFarmerBidStatus(bidId: string, status: 'accepted' | 'rejected') {
  const response = await api.patch<{ message: string; bid: BuyerBid }>(
    `/farmers/bids/${bidId}/status`,
    { status },
  );
  return response.data.bid;
}

export async function getFarmerOrders(status?: OrderStatus) {
  const response = await api.get<{ count: number; orders: BuyerOrder[] }>('/farmers/orders', {
    params: { status },
  });
  return response.data;
}

export async function updateFarmerOrderStatus(
  orderId: string,
  status: Extract<OrderStatus, 'confirmed' | 'preparing' | 'dispatched' | 'cancelled'>,
) {
  const response = await api.patch<{ message: string; order: BuyerOrder }>(
    `/farmers/orders/${orderId}/status`,
    { status },
  );
  return response.data.order;
}

export async function getCooperatives(mine = false) {
  const response = await api.get<{ count: number; cooperatives: Cooperative[] }>(
    '/farmers/cooperatives',
    { params: { mine } },
  );
  return response.data;
}

export async function createCooperative(input: CooperativeInput) {
  const response = await api.post<{ cooperative: Cooperative; message: string }>(
    '/farmers/cooperatives',
    input,
  );
  return response.data.cooperative;
}

export async function joinCooperative(cooperativeId: string) {
  const response = await api.post<{ cooperative: Cooperative; message: string }>(
    `/farmers/cooperatives/${cooperativeId}/join`,
  );
  return response.data.cooperative;
}

export async function addCooperativeContribution(
  cooperativeId: string,
  input: CooperativeContributionInput,
) {
  const response = await api.post<{ cooperative: Cooperative; message: string }>(
    `/farmers/cooperatives/${cooperativeId}/contributions`,
    input,
  );
  return response.data.cooperative;
}

export async function publishCooperativeProduct(
  cooperativeId: string,
  poolId: string,
  input: {
    fixedPrice: number;
    farmLocation: { district: string; city?: string };
    minimumOrderQuantity?: number;
  },
) {
  const response = await api.post<{ product: MarketplaceProduct; message: string }>(
    `/farmers/cooperatives/${cooperativeId}/product-pools/${poolId}/list`,
    { ...input, pricingMode: 'fixedPrice' },
  );
  return response.data.product;
}

export async function getFarmerDeliveryJobs() {
  const response = await api.get<{ count: number; jobs: DeliveryJob[] }>('/logistics/jobs');
  return response.data;
}

export async function createFarmerDeliveryJob(input: {
  orders: string[];
  pickupPoints: {
    contactName: string;
    phone?: string;
    addressLine: string;
    city: string;
    district: string;
    notes?: string;
  }[];
  destination: {
    contactName: string;
    phone?: string;
    addressLine: string;
    city: string;
    district: string;
  };
  cargoDescription: string;
  totalWeightKg: number;
  payoutAmount: number;
  scheduledPickupAt: string;
  sharedDelivery: boolean;
}) {
  const response = await api.post<{ job: DeliveryJob; message: string }>('/logistics/jobs', input);
  return response.data.job;
}
