import { api } from '@/services/api';
import type { BuyerComplaint, BuyerReview, ComplaintCategory } from '@/types/feedback';

export async function createBuyerReview(
  orderId: string,
  input: { rating: number; comment?: string },
) {
  const response = await api.post<{ message: string; review: BuyerReview }>(
    `/buyers/orders/${orderId}/reviews`,
    input,
  );
  return response.data;
}

export async function createBuyerComplaint(
  orderId: string,
  input: { category: ComplaintCategory; description: string },
) {
  const response = await api.post<{ message: string; complaint: BuyerComplaint }>(
    `/buyers/orders/${orderId}/complaints`,
    input,
  );
  return response.data;
}
