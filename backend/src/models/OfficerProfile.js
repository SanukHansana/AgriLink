import mongoose from 'mongoose';

export const OFFICER_SPECIALIZATIONS = [
  'cropProduction',
  'soilManagement',
  'pestManagement',
  'qualityCertification',
  'marketDevelopment',
  'generalAgriculture',
];

const assignedCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Assigned agriculture center is required'],
      trim: true,
      maxlength: [120, 'Agriculture center name cannot exceed 120 characters'],
    },
    district: {
      type: String,
      required: [true, 'Assigned district is required'],
      trim: true,
      maxlength: [80, 'Assigned district cannot exceed 80 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [180, 'Center address cannot exceed 180 characters'],
    },
  },
  { _id: false, versionKey: false },
);

const officerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [30, 'Employee ID cannot exceed 30 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(?:\+94|0)?[1-9][0-9]{8}$/, 'Enter a valid Sri Lankan phone number'],
    },
    assignedCenter: {
      type: assignedCenterSchema,
      required: [true, 'Assigned agriculture center is required'],
    },
    specialization: {
      type: String,
      enum: OFFICER_SPECIALIZATIONS,
      default: 'generalAgriculture',
    },
    division: {
      type: String,
      trim: true,
      maxlength: [120, 'Division cannot exceed 120 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

officerProfileSchema.index({ 'assignedCenter.district': 1, specialization: 1 });

const OfficerProfile = mongoose.model('OfficerProfile', officerProfileSchema);

export default OfficerProfile;
