import { randomInt } from 'node:crypto';

import mongoose from 'mongoose';

import { PRODUCT_UNITS } from './Bid.js';

export const ORDER_TYPES = ['fixedPrice', 'advance', 'bid'];
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'dispatched',
  'inTransit',
  'delivered',
  'cancelled',
  'deliveryFailed',
  'returned',
];

const deliveryAddressSchema = new mongoose.Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    addressLine: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: [180, 'Delivery address cannot exceed 180 characters'],
    },
    city: {
      type: String,
      required: [true, 'Delivery city is required'],
      trim: true,
      maxlength: [80, 'Delivery city cannot exceed 80 characters'],
    },
    district: {
      type: String,
      required: [true, 'Delivery district is required'],
      trim: true,
      maxlength: [80, 'Delivery district cannot exceed 80 characters'],
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Postal code cannot exceed 10 characters'],
    },
  },
  { _id: false, versionKey: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      index: true,
      default: () => `AG-${Date.now().toString().slice(-6)}${randomInt(10, 100)}`,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
    stockReserved: { type: Boolean, default: false },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paymentProvider: { type: String, enum: ['mock'] },
    paidAt: Date,
    receivedAt: Date,
    deliveryJob: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryJob', index: true },
    deliveredQuantity: { type: Number, min: 0 },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: ORDER_TYPES,
      required: true,
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
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price per unit must be greater than zero'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Total amount must be greater than zero'],
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: [true, 'Delivery address is required'],
    },
    requestedDeliveryDate: {
      type: Date,
      required() {
        return this.orderType === 'advance';
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Order notes cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.pre('validate', function calculateTotal() {
  if (Number.isFinite(this.pricePerUnit) && Number.isFinite(this.quantity)) {
    this.totalAmount = Number((this.pricePerUnit * this.quantity).toFixed(2));
  }
});

orderSchema.index({ buyer: 1, status: 1, createdAt: -1 });
orderSchema.index({ bid: 1 }, { unique: true, partialFilterExpression: { bid: { $type: 'objectId' } } });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
