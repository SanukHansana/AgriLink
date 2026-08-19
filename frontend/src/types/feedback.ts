export const COMPLAINT_CATEGORIES = [
  'productQuality',
  'delivery',
  'seller',
  'payment',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export type BuyerReview = {
  _id: string;
  order: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type BuyerComplaint = {
  _id: string;
  order: string;
  category: ComplaintCategory;
  description: string;
  status: 'submitted' | 'inReview' | 'resolved' | 'dismissed';
  createdAt: string;
};
