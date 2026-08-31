import type { ProductCategory, ProductUnit } from '@/types/marketplace';

export type PurchaseRequestStatus = 'open' | 'fulfilled';

export type PurchaseRequest = {
  _id: string;
  buyer: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unit: ProductUnit;
  maximumUnitPrice: number;
  requiredBy: string;
  deliveryLocation: { city?: string; district: string };
  qualityRequirements?: string;
  status: PurchaseRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseRequestInput = Omit<
  PurchaseRequest,
  '_id' | 'buyer' | 'createdAt' | 'updatedAt'
>;
