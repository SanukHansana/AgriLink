import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import connectDatabase from '../src/config/database.js';

try {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!name || !email || !password || password.length < 12) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in the backend environment');
  }
  await connectDatabase();
  if (await User.exists({ email })) throw new Error('Email already exists. Use a new email for the administrator');
  await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'admin' });
  console.log('Administrator created. Sign in through the web login page.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
