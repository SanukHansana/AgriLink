import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, maxlength: 250 },
  language: { type: String, enum: ['en', 'si', 'ta'], default: 'en' },
}, { timestamps: true, versionKey: false });
export default mongoose.model('PushDevice', schema);
