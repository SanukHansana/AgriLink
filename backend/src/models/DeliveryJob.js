import { randomInt } from 'node:crypto';

import mongoose from 'mongoose';

export const DELIVERY_JOB_STATUSES = [
  'available',
  'accepted',
  'collecting',
  'inTransit',
  'delivered',
  'cancelled',
];

const contactLocationFields = {
  contactName: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [80, 'Contact name cannot exceed 80 characters'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^(?:\+94|0)?[1-9][0-9]{8}$/, 'Enter a valid Sri Lankan phone number'],
  },
  addressLine: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [180, 'Address cannot exceed 180 characters'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [80, 'City cannot exceed 80 characters'],
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
    maxlength: [80, 'District cannot exceed 80 characters'],
  },
};

const pickupPointSchema = new mongoose.Schema(
  {
    ...contactLocationFields,
    sequence: {
      type: Number,
      required: true,
      min: [1, 'Pickup sequence must begin at 1'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Pickup notes cannot exceed 300 characters'],
    },
  },
  { versionKey: false },
);

const destinationSchema = new mongoose.Schema(contactLocationFields, {
  _id: false,
  versionKey: false,
});

const deliveryProofSchema = new mongoose.Schema(
  {
    photoData: {
      type: String,
      select: false,
      maxlength: [900000, 'Proof photo is too large'],
    },
    photoAttached: {
      type: Boolean,
      default: false,
    },
    receiverName: {
      type: String,
      trim: true,
      maxlength: [80, 'Receiver name cannot exceed 80 characters'],
    },
    receiverSignature: {
      type: String,
      trim: true,
      maxlength: [120, 'Receiver signature cannot exceed 120 characters'],
    },
    confirmedAt: Date,
  },
  { _id: false, versionKey: false },
);

const statusUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: DELIVERY_JOB_STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Status note cannot exceed 500 characters'],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false, versionKey: false },
);

const deliveryJobSchema = new mongoose.Schema(
  {
    jobCode: {
      type: String,
      unique: true,
      index: true,
      default: () => `DL-${Date.now().toString().slice(-6)}${randomInt(10, 100)}`,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orders: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
      required: [true, 'At least one order is required'],
      validate: {
        validator: (orders) => orders.length > 0,
        message: 'At least one order is required',
      },
    },
    pickupPoints: {
      type: [pickupPointSchema],
      required: [true, 'At least one pickup point is required'],
      validate: {
        validator: (points) => points.length > 0,
        message: 'At least one pickup point is required',
      },
    },
    destination: {
      type: destinationSchema,
      required: [true, 'Delivery destination is required'],
    },
    cargoDescription: {
      type: String,
      required: [true, 'Cargo description is required'],
      trim: true,
      maxlength: [300, 'Cargo description cannot exceed 300 characters'],
    },
    totalWeightKg: {
      type: Number,
      required: [true, 'Total cargo weight is required'],
      min: [1, 'Total cargo weight must be at least 1 kg'],
    },
    routeDistanceKm: {
      type: Number,
      min: [0, 'Route distance cannot be negative'],
    },
    payoutAmount: {
      type: Number,
      required: [true, 'Driver payout is required'],
      min: [0, 'Driver payout cannot be negative'],
    },
    scheduledPickupAt: {
      type: Date,
      required: [true, 'Scheduled pickup time is required'],
      index: true,
    },
    sharedDelivery: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: DELIVERY_JOB_STATUSES,
      default: 'available',
      index: true,
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    acceptedAt: Date,
    pickupArrivedAt: Date,
    transitStartedAt: Date,
    deliveredAt: Date,
    deliveryProof: deliveryProofSchema,
    statusUpdates: {
      type: [statusUpdateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

deliveryJobSchema.index({ status: 1, scheduledPickupAt: 1 });
deliveryJobSchema.index({ assignedDriver: 1, status: 1, createdAt: -1 });
deliveryJobSchema.index({ createdBy: 1, createdAt: -1 });

const DeliveryJob = mongoose.model('DeliveryJob', deliveryJobSchema);

export default DeliveryJob;
