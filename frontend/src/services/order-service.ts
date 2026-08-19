import { api } from '@/services/api';
import type {
  BuyerOrder,
  DeliveryAddressInput,
  OrderStatus,
} from '@/types/transactions';

type CreateFixedPriceOrderInput = {
  productId: string;
  quantity: number;
  deliveryAddress: DeliveryAddressInput;
  notes?: string;
};

type CreateAdvanceOrderInput = CreateFixedPriceOrderInput & {
  requestedDeliveryDate: string;
};

export async function createFixedPriceOrder(input: CreateFixedPriceOrderInput) {
  const response = await api.post<{ message: string; order: BuyerOrder }>(
    '/buyers/orders/fixed-price',
    input,
  );
  return response.data;
}

export async function createAdvanceOrder(input: CreateAdvanceOrderInput) {
  const response = await api.post<{ message: string; order: BuyerOrder }>(
    '/buyers/orders/advance',
    input,
  );
  return response.data;
}

export async function getBuyerOrders(status?: OrderStatus) {
  const response = await api.get<{ count: number; orders: BuyerOrder[] }>('/buyers/orders', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function getBuyerOrder(orderId: string) {
  const response = await api.get<{ order: BuyerOrder }>(`/buyers/orders/${orderId}`);
  return response.data;
}
