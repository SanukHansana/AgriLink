import mongoose from 'mongoose';

export const DELIVERY_ISSUE_TYPES = [
  'delay',
  'vehicle',
  'cargo',
  'route',
  'customer',
  'payment',
  'other',
];
export const DELIVERY_ISSUE_STATUSES = ['open', 'inReview', 'resolved'];

const deliveryIssueSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryJob',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issueType: {
      type: String,
      enum: DELIVERY_ISSUE_TYPES,
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      minlength: [10, 'Issue description must contain at least 10 characters'],
      maxlength: [1000, 'Issue description cannot exceed 1000 characters'],
    },
    photoData: {
      type: String,
      select: false,
      maxlength: [900000, 'Issue photo is too large'],
    },
    photoAttached: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: DELIVERY_ISSUE_STATUSES,
      default: 'open',
      index: true,
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [1000, 'Issue resolution cannot exceed 1000 characters'],
    },
    resolvedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

deliveryIssueSchema.index({ driver: 1, createdAt: -1 });

const DeliveryIssue = mongoose.model('DeliveryIssue', deliveryIssueSchema);

export default DeliveryIssue;
