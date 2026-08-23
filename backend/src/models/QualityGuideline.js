import mongoose from 'mongoose';

export const QUALITY_GUIDELINE_STATUSES = ['active', 'archived'];

const qualityGuidelineSchema = new mongoose.Schema(
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
    growingRegion: {
      type: String,
      trim: true,
      maxlength: [120, 'Growing region cannot exceed 120 characters'],
    },
    maxMoisture: {
      type: String,
      required: [true, 'Maximum moisture standard is required'],
      trim: true,
      maxlength: [80, 'Maximum moisture standard cannot exceed 80 characters'],
    },
    minPurity: {
      type: String,
      required: [true, 'Minimum purity standard is required'],
      trim: true,
      maxlength: [80, 'Minimum purity standard cannot exceed 80 characters'],
    },
    sizingGrade: {
      type: String,
      required: [true, 'Sizing or grade standard is required'],
      trim: true,
      maxlength: [160, 'Sizing or grade standard cannot exceed 160 characters'],
    },
    requiredCertification: {
      type: String,
      required: [true, 'Required certification is required'],
      trim: true,
      maxlength: [160, 'Required certification cannot exceed 160 characters'],
    },
    status: {
      type: String,
      enum: QUALITY_GUIDELINE_STATUSES,
      default: 'active',
      index: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false },
);

qualityGuidelineSchema.index({ status: 1, cropName: 1 });

const QualityGuideline = mongoose.model('QualityGuideline', qualityGuidelineSchema);

export default QualityGuideline;
