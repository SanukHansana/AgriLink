import mongoose from 'mongoose';

export const VEHICLE_TYPES = [
  'motorcycle',
  'threeWheeler',
  'van',
  'lorry',
  'refrigeratedTruck',
  'other',
];

const vehicleSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: VEHICLE_TYPES,
      required: [true, 'Vehicle type is required'],
    },
    registrationNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, 'Registration number must contain at least 4 characters'],
      maxlength: [20, 'Registration number cannot exceed 20 characters'],
    },
    make: {
      type: String,
      trim: true,
      maxlength: [60, 'Vehicle make cannot exceed 60 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [60, 'Vehicle model cannot exceed 60 characters'],
    },
    capacityKg: {
      type: Number,
      required: [true, 'Vehicle capacity is required'],
      min: [1, 'Vehicle capacity must be at least 1 kg'],
    },
    isRefrigerated: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

vehicleSchema.index({ driver: 1, isActive: 1, createdAt: -1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
