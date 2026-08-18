import type { MarketplaceProduct, ProductUnit } from '@/types/marketplace';

const numberFormatter = new Intl.NumberFormat('en-LK', {
  maximumFractionDigits: 2,
});

export function formatLkr(value: number) {
  return `LKR ${numberFormatter.format(value)}`;
}

export function formatProductUnit(unit: ProductUnit) {
  if (unit === 'piece') {
    return 'piece';
  }

  return unit;
}

export function getProductPrice(product: MarketplaceProduct) {
  return product.fixedPrice ?? product.minimumBidPrice;
}

export function getSellerName(product: MarketplaceProduct) {
  return typeof product.farmer === 'string' ? 'Registered farmer' : product.farmer.name;
}
