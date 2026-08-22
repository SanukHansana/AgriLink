import mongoose from 'mongoose';

import { PRODUCT_UNITS } from './Bid.js';
import { PRODUCT_CATEGORIES } from './Product.js';

const memberSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false, versionKey: false },
);

const contributionSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quantity: { type: Number, required: true, min: [0.01, 'Contribution must be positive'] },
    qualityGrade: { type: String, trim: true, maxlength: 80 },
  },
  { _id: false, versionKey: false },
);

const productPoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    unit: { type: String, enum: PRODUCT_UNITS, required: true },
    contributions: { type: [contributionSchema], default: [] },
    totalQuantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

productPoolSchema.pre('validate', function calculateTotal() {
  this.totalQuantity = this.contributions.reduce((total, item) => total + item.quantity, 0);
});

const cooperativeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600 },
    district: { type: String, required: true, trim: true, maxlength: 80, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    productPools: { type: [productPoolSchema], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  },
  { timestamps: true, versionKey: false },
);

cooperativeSchema.index({ status: 1, district: 1, createdAt: -1 });

const Cooperative = mongoose.model('Cooperative', cooperativeSchema);
export default Cooperative;
