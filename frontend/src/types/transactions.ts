import type { ProductUnit } from '@/types/marketplace';

export type BidStatus = 'active' | 'accepted' | 'rejected' | 'expired';

export type BidProductSummary = {
  _id: string;
  name: string;
  images: string[];
  unit: ProductUnit;
  minimumBidPrice?: number;
  biddingClosesAt?: string;
  status: 'active' | 'inactive' | 'sold';
  farmLocation?: {
    district: string;
  };
};

export type BuyerBid = {
  _id: string;
  buyer: string;
  product: string | BidProductSummary;
  bidAmount: number;
  quantity: number;
  unit: ProductUnit;
  totalAmount: number;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryAddressInput = {
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'dispatched'
  | 'inTransit'
  | 'delivered'
  | 'cancelled';

export type OrderProductSummary = {
  _id: string;
  name: string;
  images: string[];
  unit: ProductUnit;
  farmLocation?: {
    addressLine?: string;
    city?: string;
    district: string;
  };
};

export type BuyerOrder = {
  _id: string;
  orderCode: string;
  buyer: string;
  seller: string | { _id: string; name: string };
  product: string | OrderProductSummary;
  orderType: 'fixedPrice' | 'advance';
  quantity: number;
  unit: ProductUnit;
  pricePerUnit: number;
  totalAmount: number;
  deliveryAddress: DeliveryAddressInput;
  requestedDeliveryDate?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};
