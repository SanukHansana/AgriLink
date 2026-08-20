import mongoose from 'mongoose';

export const DRIVER_AVAILABILITY_STATUSES = ['offline', 'available', 'busy'];

const baseLocationSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      trim: true,
      maxlength: [80, 'Base city cannot exceed 80 characters'],
    },
    district: {
      type: String,
      required: [true, 'Base district is required'],
      trim: true,
      maxlength: [80, 'Base district cannot exceed 80 characters'],
    },
  },
  { _id: false, versionKey: false },
);

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(?:\+94|0)?[1-9][0-9]{8}$/, 'Enter a valid Sri Lankan phone number'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'Driving license number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [4, 'Driving license number must contain at least 4 characters'],
      maxlength: [30, 'Driving license number cannot exceed 30 characters'],
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'Driving license expiry date is required'],
    },
    baseLocation: {
      type: baseLocationSchema,
      required: [true, 'Driver base location is required'],
    },
    availabilityStatus: {
      type: String,
      enum: DRIVER_AVAILABILITY_STATUSES,
      default: 'offline',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

driverProfileSchema.index({ availabilityStatus: 1, 'baseLocation.district': 1 });

const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);

export default DriverProfile;
