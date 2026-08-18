import mongoose from 'mongoose';

export const BUYER_TYPES = [
  'individual',
  'retailer',
  'wholesaler',
  'restaurant',
  'exporter',
  'processor',
];

const deliveryLocationSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: [40, 'Location label cannot exceed 40 characters'],
    },
    addressLine: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
      maxlength: [180, 'Delivery address cannot exceed 180 characters'],
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
    postalCode: {
      type: String,
      trim: true,
      maxlength: [10, 'Postal code cannot exceed 10 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false },
);

const buyerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    buyerType: {
      type: String,
      enum: BUYER_TYPES,
      required: [true, 'Buyer type is required'],
    },
    businessName: {
      type: String,
      trim: true,
      maxlength: [120, 'Business name cannot exceed 120 characters'],
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
      maxlength: [60, 'Business registration number cannot exceed 60 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(?:\+94|0)?[1-9][0-9]{8}$/, 'Enter a valid Sri Lankan phone number'],
    },
    deliveryLocations: {
      type: [deliveryLocationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const BuyerProfile = mongoose.model('BuyerProfile', buyerProfileSchema);

export default BuyerProfile;
