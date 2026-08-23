import mongoose from 'mongoose';

export const ASSISTANCE_REQUEST_CATEGORIES = [
  'farmerRegistration',
  'qualityCertification',
  'fertilizerSubsidy',
  'cropGuidance',
  'marketGuidance',
  'other',
];
export const ASSISTANCE_REQUEST_PRIORITIES = ['low', 'medium', 'high'];
export const ASSISTANCE_REQUEST_STATUSES = [
  'pending',
  'inReview',
  'approved',
  'revisionRequired',
  'rejected',
  'resolved',
];
export const OFFICIAL_RESPONSE_TYPES = [
  'approved',
  'approvedAndScheduled',
  'revisionRequired',
  'rejected',
  'information',
];

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Attachment name is required'],
      trim: true,
      maxlength: [120, 'Attachment name cannot exceed 120 characters'],
    },
    url: {
      type: String,
      required: [true, 'Attachment URL is required'],
      trim: true,
      maxlength: [500, 'Attachment URL cannot exceed 500 characters'],
    },
    fileType: {
      type: String,
      trim: true,
      maxlength: [80, 'Attachment file type cannot exceed 80 characters'],
    },
  },
  { _id: true, versionKey: false },
);

const responseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: OFFICIAL_RESPONSE_TYPES,
      required: [true, 'Response type is required'],
    },
    message: {
      type: String,
      required: [true, 'Official response message is required'],
      trim: true,
      minlength: [10, 'Official response must contain at least 10 characters'],
      maxlength: [2000, 'Official response cannot exceed 2000 characters'],
    },
    scheduledVisitAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true, versionKey: false },
);

const assistanceRequestSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ASSISTANCE_REQUEST_CATEGORIES,
      required: [true, 'Request category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Request title is required'],
      trim: true,
      minlength: [3, 'Request title must contain at least 3 characters'],
      maxlength: [160, 'Request title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Request description is required'],
      trim: true,
      minlength: [10, 'Request description must contain at least 10 characters'],
      maxlength: [2000, 'Request description cannot exceed 2000 characters'],
    },
    farmLocation: {
      address: {
        type: String,
        trim: true,
        maxlength: [180, 'Farm address cannot exceed 180 characters'],
      },
      district: {
        type: String,
        required: [true, 'Farm district is required'],
        trim: true,
        maxlength: [80, 'Farm district cannot exceed 80 characters'],
      },
    },
    farmSizeAcres: {
      type: Number,
      min: [0.01, 'Farm size must be greater than zero'],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      validate: {
        validator: (attachments) => attachments.length <= 5,
        message: 'A request can contain up to 5 attachments',
      },
    },
    priority: {
      type: String,
      enum: ASSISTANCE_REQUEST_PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ASSISTANCE_REQUEST_STATUSES,
      default: 'pending',
      index: true,
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Internal notes cannot exceed 2000 characters'],
    },
    responses: {
      type: [responseSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assistanceRequestSchema.index({ status: 1, priority: -1, createdAt: -1 });
assistanceRequestSchema.index({ 'farmLocation.district': 1, status: 1 });

const AssistanceRequest = mongoose.model('AssistanceRequest', assistanceRequestSchema);

export default AssistanceRequest;
