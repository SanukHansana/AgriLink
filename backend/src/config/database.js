import mongoose from 'mongoose';

export default async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI ?? process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not configured (legacy MONGODB_URI is also supported)');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}
