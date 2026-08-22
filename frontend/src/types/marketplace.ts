export type ProductCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'spices'
  | 'herbs'
  | 'coconut'
  | 'other';

export type ListingType = 'current' | 'future';
export type PricingMode = 'fixedPrice' | 'bidding' | 'both';
export type ProductUnit = 'kg' | 'piece' | 'box';
export type ProductSort = 'newest' | 'priceAsc' | 'priceDesc';

export type ProductSeller = {
  _id: string;
  name: string;
};

export type MarketplaceProduct = {
  _id: string;
  farmer: string | ProductSeller;
  cooperative?: string;
  name: string;
  category: ProductCategory;
  description?: string;
  images: string[];
  listingType: ListingType;
  availableQuantity: number;
  minimumOrderQuantity: number;
  unit: ProductUnit;
  qualityGrade?: string;
  farmLocation: {
    addressLine?: string;
    city?: string;
    district: string;
  };
  harvestDate?: string;
  pricingMode: PricingMode;
  fixedPrice?: number;
  minimumBidPrice?: number;
  biddingClosesAt?: string;
  status: 'active' | 'pending' | 'inactive' | 'sold';
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceFilters = {
  q?: string;
  category?: ProductCategory;
  listingType?: ListingType;
  pricingMode?: PricingMode;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type MarketplaceResponse = {
  products: MarketplaceProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
