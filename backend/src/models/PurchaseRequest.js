import mongoose from 'mongoose';

import { PRODUCT_UNITS } from './Bid.js';
import { PRODUCT_CATEGORIES } from './Product.js';

export const PURCHASE_REQUEST_STATUSES = ['open', 'fulfilled'];

const deliveryLocationSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true, maxlength: 80 },
    district: {
      type: String,
      required: [true, 'Delivery district is required'],
      trim: true,
      maxlength: [80, 'Delivery district cannot exceed 80 characters'],
    },
  },
  { _id: false, versionKey: false },
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productName: {
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
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      enum: PRODUCT_UNITS,
      required: [true, 'Unit is required'],
    },
    maximumUnitPrice: {
      type: Number,
      required: [true, 'Maximum unit price is required'],
      min: [0.01, 'Maximum unit price must be greater than zero'],
    },
    requiredBy: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    deliveryLocation: {
      type: deliveryLocationSchema,
      required: [true, 'Delivery location is required'],
    },
    qualityRequirements: {
      type: String,
      trim: true,
      maxlength: [500, 'Quality requirements cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: PURCHASE_REQUEST_STATUSES,
      default: 'open',
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

purchaseRequestSchema.index({ buyer: 1, status: 1, createdAt: -1 });
purchaseRequestSchema.index({ status: 1, category: 1, requiredBy: 1 });

const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);

export default PurchaseRequest;
