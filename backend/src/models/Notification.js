import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true, maxlength: 700 },
  readAt: Date,
  eventKey: { type: String, required: true },
}, { timestamps: true, versionKey: false });
schema.index({ user: 1, eventKey: 1 }, { unique: true });
export default mongoose.model('Notification', schema);
