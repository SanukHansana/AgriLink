import { api } from '@/services/api';
import type {
  PurchaseRequest,
  PurchaseRequestInput,
  PurchaseRequestStatus,
} from '@/types/purchase-request';

export async function getPurchaseRequests(status?: PurchaseRequestStatus) {
  const response = await api.get<{ count: number; purchaseRequests: PurchaseRequest[] }>(
    '/buyers/purchase-requests',
    { params: { status } },
  );
  return response.data.purchaseRequests;
}

export async function getPurchaseRequest(requestId: string) {
  const response = await api.get<{ purchaseRequest: PurchaseRequest }>(
    `/buyers/purchase-requests/${requestId}`,
  );
  return response.data.purchaseRequest;
}

export async function createPurchaseRequest(input: PurchaseRequestInput) {
  const response = await api.post<{ purchaseRequest: PurchaseRequest }>(
    '/buyers/purchase-requests',
    input,
  );
  return response.data.purchaseRequest;
}

export async function updatePurchaseRequest(
  requestId: string,
  input: Partial<PurchaseRequestInput>,
) {
  const response = await api.patch<{ purchaseRequest: PurchaseRequest }>(
    `/buyers/purchase-requests/${requestId}`,
    input,
  );
  return response.data.purchaseRequest;
}

export async function deletePurchaseRequest(requestId: string) {
  await api.delete(`/buyers/purchase-requests/${requestId}`);
}
