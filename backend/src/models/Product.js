import mongoose from 'mongoose';

import { PRODUCT_UNITS } from './Bid.js';

export const PRODUCT_CATEGORIES = [
  'vegetables',
  'fruits',
  'grains',
  'spices',
  'herbs',
  'coconut',
  'other',
];
export const LISTING_TYPES = ['current', 'future'];
export const PRICING_MODES = ['fixedPrice', 'bidding', 'both'];
export const PRODUCT_STATUSES = ['active', 'inactive', 'sold'];

const farmLocationSchema = new mongoose.Schema(
  {
    addressLine: {
      type: String,
      trim: true,
      maxlength: [180, 'Farm address cannot exceed 180 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [80, 'Farm city cannot exceed 80 characters'],
    },
    district: {
      type: String,
      required: [true, 'Farm district is required'],
      trim: true,
      maxlength: [80, 'Farm district cannot exceed 80 characters'],
    },
  },
  { _id: false, versionKey: false },
);

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must contain at least 2 characters'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    category: {
      type: String,
      enum: PRODUCT_CATEGORIES,
      required: [true, 'Product category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (images) => images.length <= 5,
        message: 'A product can contain up to 5 images',
      },
    },
    listingType: {
      type: String,
      enum: LISTING_TYPES,
      required: [true, 'Listing type is required'],
      index: true,
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: PRODUCT_UNITS,
      required: [true, 'Unit is required'],
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
      min: [0.01, 'Minimum order quantity must be greater than zero'],
    },
    qualityGrade: {
      type: String,
      trim: true,
      maxlength: [80, 'Quality grade cannot exceed 80 characters'],
    },
    farmLocation: {
      type: farmLocationSchema,
      required: [true, 'Farm location is required'],
    },
    harvestDate: {
      type: Date,
      required() {
        return this.listingType === 'future';
      },
    },
    pricingMode: {
      type: String,
      enum: PRICING_MODES,
      required: [true, 'Pricing mode is required'],
      index: true,
    },
    fixedPrice: {
      type: Number,
      min: [0.01, 'Fixed price must be greater than zero'],
      required() {
        return this.pricingMode === 'fixedPrice' || this.pricingMode === 'both';
      },
    },
    minimumBidPrice: {
      type: Number,
      min: [0.01, 'Minimum bid price must be greater than zero'],
      required() {
        return this.pricingMode === 'bidding' || this.pricingMode === 'both';
      },
    },
    biddingClosesAt: {
      type: Date,
      required() {
        return this.pricingMode === 'bidding' || this.pricingMode === 'both';
      },
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

productSchema.index({ name: 'text', category: 'text', description: 'text' });
productSchema.index({ status: 1, listingType: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, fixedPrice: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
