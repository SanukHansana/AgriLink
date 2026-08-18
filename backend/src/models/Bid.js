import mongoose from 'mongoose';

export const BID_STATUSES = ['active', 'accepted', 'rejected', 'expired'];
export const PRODUCT_UNITS = ['kg', 'piece', 'box'];

const bidSchema = new mongoose.Schema(
  {
    buyer: {
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
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0.01, 'Bid amount must be greater than zero'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than zero'],
    },
    unit: {
      type: String,
      enum: PRODUCT_UNITS,
      required: [true, 'Unit is required'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Total amount must be greater than zero'],
    },
    status: {
      type: String,
      enum: BID_STATUSES,
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

bidSchema.pre('validate', function calculateTotal() {
  if (Number.isFinite(this.bidAmount) && Number.isFinite(this.quantity)) {
    this.totalAmount = Number((this.bidAmount * this.quantity).toFixed(2));
  }
});

bidSchema.index({ buyer: 1, status: 1, createdAt: -1 });
bidSchema.index({ product: 1, status: 1, createdAt: -1 });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
