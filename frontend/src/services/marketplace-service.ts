import { api } from '@/services/api';
import type {
  MarketplaceFilters,
  MarketplaceProduct,
  MarketplaceResponse,
} from '@/types/marketplace';

export async function getMarketplaceProducts(filters: MarketplaceFilters = {}) {
  const response = await api.get<MarketplaceResponse>('/buyers/marketplace/products', {
    params: filters,
  });

  return response.data;
}

export async function getMarketplaceProduct(productId: string) {
  const response = await api.get<{ product: MarketplaceProduct }>(
    `/buyers/marketplace/products/${productId}`,
  );

  return response.data.product;
}
