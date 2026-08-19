import { api } from '@/services/api';
import type { BuyerOrder, DeliveryAddressInput } from '@/types/transactions';

type CreateFixedPriceOrderInput = {
  productId: string;
  quantity: number;
  deliveryAddress: DeliveryAddressInput;
  notes?: string;
};

export async function createFixedPriceOrder(input: CreateFixedPriceOrderInput) {
  const response = await api.post<{ message: string; order: BuyerOrder }>(
    '/buyers/orders/fixed-price',
    input,
  );
  return response.data;
}
