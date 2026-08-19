export const BUYER_TYPES = [
  'individual',
  'retailer',
  'wholesaler',
  'restaurant',
  'exporter',
  'processor',
] as const;

export type BuyerType = (typeof BUYER_TYPES)[number];

export type DeliveryLocation = {
  _id?: string;
  label?: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault?: boolean;
};

export type BuyerProfile = {
  _id: string;
  user: string;
  buyerType: BuyerType;
  businessName?: string;
  businessRegistrationNumber?: string;
  phone: string;
  deliveryLocations: DeliveryLocation[];
  createdAt: string;
  updatedAt: string;
};

export type BuyerProfileInput = {
  buyerType: BuyerType;
  businessName?: string;
  phone: string;
  deliveryLocations: DeliveryLocation[];
};
