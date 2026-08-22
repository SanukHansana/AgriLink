import type {
  ListingType,
  MarketplaceProduct,
  PricingMode,
  ProductCategory,
  ProductUnit,
} from '@/types/marketplace';

export type FarmerProfile = {
  _id: string;
  user: string | { _id: string; name: string; email: string };
  phone: string;
  farmName: string;
  farmLocation: {
    addressLine?: string;
    city: string;
    district: string;
  };
  farmSizeAcres?: number;
  mainCrops: string[];
  preferredLanguage: 'en' | 'si' | 'ta';
  createdAt: string;
  updatedAt: string;
};

export type FarmerProfileInput = {
  phone: string;
  farmName: string;
  farmLocation: {
    addressLine?: string;
    city: string;
    district: string;
  };
  farmSizeAcres?: number;
  mainCrops?: string[];
  preferredLanguage?: FarmerProfile['preferredLanguage'];
};

export type FarmerProductInput = {
  name: string;
  category: ProductCategory;
  description?: string;
  images?: string[];
  listingType: ListingType;
  availableQuantity: number;
  unit: ProductUnit;
  minimumOrderQuantity: number;
  qualityGrade?: string;
  farmLocation: MarketplaceProduct['farmLocation'];
  harvestDate?: string;
  pricingMode: PricingMode;
  fixedPrice?: number;
  minimumBidPrice?: number;
  biddingClosesAt?: string;
  status?: MarketplaceProduct['status'];
};

export type CooperativeMember = {
  farmer: string | { _id: string; name: string };
  role: 'owner' | 'member';
  joinedAt: string;
};

export type CooperativeProductPool = {
  _id: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  totalQuantity: number;
  contributions: {
    farmer: string;
    quantity: number;
    qualityGrade?: string;
  }[];
};

export type Cooperative = {
  _id: string;
  name: string;
  description?: string;
  district: string;
  createdBy: string | { _id: string; name: string };
  members: CooperativeMember[];
  productPools: CooperativeProductPool[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type CooperativeInput = {
  name: string;
  description?: string;
  district: string;
};

export type CooperativeContributionInput = {
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  quantity: number;
  qualityGrade?: string;
};
