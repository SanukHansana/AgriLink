import jwt from 'jsonwebtoken';

import User from '../models/User.js';

export async function requireAuth(request, response, next) {
  try {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return response.status(401).json({ message: 'Authentication is required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      const error = new Error('JWT_SECRET is not configured');
      error.statusCode = 500;
      throw error;
    }

    const token = authorization.slice('Bearer '.length).trim();
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return response.status(401).json({ message: 'Authentication is no longer valid' });
    }

    request.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return response.status(401).json({ message: 'Authentication token is invalid or expired' });
    }

    return next(error);
  }
}
