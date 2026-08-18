import mongoose from 'mongoose';

export function isValidMongoId(value) {
  return mongoose.isValidObjectId(value);
}

export function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function parseValidDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
