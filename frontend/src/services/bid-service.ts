import { api } from '@/services/api';
import type { BidStatus, BuyerBid, DeliveryAddressInput } from '@/types/transactions';

type CreateBidInput = {
  productId: string;
  bidAmount: number;
  quantity: number;
  deliveryAddress: DeliveryAddressInput;
  requestedDeliveryDate?: string;
};

export async function createBuyerBid(input: CreateBidInput) {
  const response = await api.post<{ message: string; bid: BuyerBid }>('/buyers/bids', input);
  return response.data;
}

export async function getBuyerBids(status?: BidStatus) {
  const response = await api.get<{ count: number; bids: BuyerBid[] }>('/buyers/bids', {
    params: status ? { status } : undefined,
  });
  return response.data;
}
