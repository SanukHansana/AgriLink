import mongoose from 'mongoose';

export const NOTICE_TYPES = ['general', 'subsidy', 'training', 'emergency', 'marketSurplus'];
export const NOTICE_STATUSES = ['draft', 'published', 'archived'];
export const NOTICE_LANGUAGES = ['en', 'si', 'ta'];
export const NOTICE_AUDIENCES = ['allFarmers', 'district'];

const noticeSchema = new mongoose.Schema(
  {
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTICE_TYPES,
      required: [true, 'Notice type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      minlength: [3, 'Notice title must contain at least 3 characters'],
      maxlength: [160, 'Notice title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Notice description is required'],
      trim: true,
      minlength: [10, 'Notice description must contain at least 10 characters'],
      maxlength: [3000, 'Notice description cannot exceed 3000 characters'],
    },
    targetAudience: {
      type: String,
      enum: NOTICE_AUDIENCES,
      default: 'allFarmers',
      index: true,
    },
    targetDistrict: {
      type: String,
      trim: true,
      maxlength: [80, 'Target district cannot exceed 80 characters'],
    },
    languages: {
      type: [String],
      enum: NOTICE_LANGUAGES,
      default: ['en'],
      validate: {
        validator: (languages) => languages.length > 0 && new Set(languages).size === languages.length,
        message: 'Select at least one unique publishing language',
      },
    },
    isEmergency: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: NOTICE_STATUSES,
      default: 'draft',
      index: true,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

noticeSchema.pre('validate', function validateDistrictAudience() {
  if (this.targetAudience === 'district' && !this.targetDistrict?.trim()) {
    this.invalidate('targetDistrict', 'Target district is required for a district notice');
  }
});

noticeSchema.index({ status: 1, publishedAt: -1 });
noticeSchema.index({ targetAudience: 1, targetDistrict: 1, status: 1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
