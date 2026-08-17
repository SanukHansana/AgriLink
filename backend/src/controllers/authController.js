import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User, { USER_ROLES } from '../models/User.js';

const PASSWORD_MIN_LENGTH = 8;

function createToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '7d' },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function register(request, response, next) {
  try {
    const { name, email, password, role } = request.body;

    if (!name || !email || !password || !role) {
      return response.status(400).json({
        message: 'Name, email, password and role are required',
      });
    }

    if (!USER_ROLES.includes(role)) {
      return response.status(400).json({ message: 'Select a valid user role' });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return response.status(400).json({
        message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return response.status(409).json({
        message: 'An account already exists for this email address',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    });

    return response.status(201).json({
      message: 'Account created successfully',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select('+passwordHash');

    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !passwordMatches || !user.isActive) {
      return response.status(401).json({ message: 'Invalid email or password' });
    }

    return response.status(200).json({
      message: 'Login successful',
      token: createToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export function getCurrentUser(request, response) {
  return response.status(200).json({ user: publicUser(request.user) });
}
