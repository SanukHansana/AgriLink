import mongoose from 'mongoose';

export const LISTING_REPORT_REASONS = [
  'misleadingQuality',
  'wrongPricing',
  'prohibitedItem',
  'duplicateListing',
  'suspectedFraud',
  'other',
];
export const LISTING_REPORT_RISKS = ['low', 'medium', 'high'];
export const LISTING_REPORT_STATUSES = ['pending', 'inReview', 'suspended', 'dismissed', 'resolved'];

const reportedListingSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: LISTING_REPORT_REASONS,
      required: [true, 'Listing report reason is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Listing report description is required'],
      trim: true,
      minlength: [10, 'Listing report description must contain at least 10 characters'],
      maxlength: [1200, 'Listing report description cannot exceed 1200 characters'],
    },
    advertisedPrice: {
      type: Number,
      min: [0, 'Advertised price cannot be negative'],
    },
    observedPrice: {
      type: Number,
      min: [0, 'Observed price cannot be negative'],
    },
    risk: {
      type: String,
      enum: LISTING_REPORT_RISKS,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: LISTING_REPORT_STATUSES,
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [1200, 'Listing review note cannot exceed 1200 characters'],
    },
    reviewedAt: Date,
  },
  { timestamps: true, versionKey: false },
);

reportedListingSchema.index({ status: 1, risk: -1, createdAt: -1 });
reportedListingSchema.index({ product: 1, reportedBy: 1, status: 1 });

const ReportedListing = mongoose.model('ReportedListing', reportedListingSchema);

export default ReportedListing;
