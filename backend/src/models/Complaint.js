import mongoose from 'mongoose';

export const COMPLAINT_CATEGORIES = [
  'productQuality',
  'delivery',
  'seller',
  'payment',
  'other',
];

export const COMPLAINT_STATUSES = ['submitted', 'inReview', 'resolved', 'dismissed'];

const complaintSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: [true, 'Complaint category is required'],
    },
    description: {
      type: String,
      required: [true, 'Complaint description is required'],
      trim: true,
      minlength: [10, 'Complaint description must contain at least 10 characters'],
      maxlength: [1000, 'Complaint description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'submitted',
      index: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution note cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

complaintSchema.index({ buyer: 1, status: 1, createdAt: -1 });
complaintSchema.index({ order: 1, createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
