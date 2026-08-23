import mongoose from 'mongoose';

export const SURPLUS_LEVELS = ['critical', 'moderate', 'normal'];
export const SURPLUS_ADVISORY_STATUSES = ['active', 'resolved'];

const surplusAdvisorySchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
      minlength: [2, 'Crop name must contain at least 2 characters'],
      maxlength: [120, 'Crop name cannot exceed 120 characters'],
      index: true,
    },
    harvestSeason: {
      type: String,
      trim: true,
      maxlength: [80, 'Harvest season cannot exceed 80 characters'],
    },
    affectedDistricts: {
      type: [String],
      required: [true, 'At least one affected district is required'],
      validate: {
        validator: (districts) => districts.length > 0 && districts.length <= 10,
        message: 'Provide between 1 and 10 affected districts',
      },
    },
    surplusVolumeMt: {
      type: Number,
      required: [true, 'Surplus volume is required'],
      min: [0.01, 'Surplus volume must be greater than zero'],
    },
    level: {
      type: String,
      enum: SURPLUS_LEVELS,
      required: [true, 'Surplus level is required'],
      index: true,
    },
    priceImpactPercent: {
      type: Number,
      required: [true, 'Estimated price impact is required'],
      min: [-100, 'Price impact cannot be below -100%'],
      max: [100, 'Price impact cannot exceed 100%'],
    },
    recommendedActions: {
      type: [String],
      required: [true, 'At least one recommended action is required'],
      validate: {
        validator: (actions) => actions.length > 0 && actions.length <= 8,
        message: 'Provide between 1 and 8 recommended actions',
      },
    },
    status: {
      type: String,
      enum: SURPLUS_ADVISORY_STATUSES,
      default: 'active',
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

surplusAdvisorySchema.index({ status: 1, level: 1, issuedAt: -1 });
surplusAdvisorySchema.index({ affectedDistricts: 1, status: 1 });

const SurplusAdvisory = mongoose.model('SurplusAdvisory', surplusAdvisorySchema);

export default SurplusAdvisory;
