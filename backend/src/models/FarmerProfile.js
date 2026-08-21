import mongoose from 'mongoose';

export const FARMER_LANGUAGES = ['en', 'si', 'ta'];

const farmLocationSchema = new mongoose.Schema(
  {
    addressLine: {
      type: String,
      trim: true,
      maxlength: [180, 'Farm address cannot exceed 180 characters'],
    },
    city: {
      type: String,
      required: [true, 'Farm city is required'],
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

const farmerProfileSchema = new mongoose.Schema(
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
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      minlength: [2, 'Farm name must contain at least 2 characters'],
      maxlength: [120, 'Farm name cannot exceed 120 characters'],
    },
    farmLocation: {
      type: farmLocationSchema,
      required: [true, 'Farm location is required'],
    },
    farmSizeAcres: {
      type: Number,
      min: [0.01, 'Farm size must be greater than zero'],
    },
    mainCrops: {
      type: [String],
      default: [],
      validate: {
        validator: (crops) => crops.length <= 10,
        message: 'A farmer profile can list up to 10 main crops',
      },
    },
    preferredLanguage: {
      type: String,
      enum: FARMER_LANGUAGES,
      default: 'en',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

farmerProfileSchema.index({ 'farmLocation.district': 1 });

const FarmerProfile = mongoose.model('FarmerProfile', farmerProfileSchema);

export default FarmerProfile;
