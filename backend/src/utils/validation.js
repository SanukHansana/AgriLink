import mongoose from 'mongoose';

export function validCoordinates(latitude, longitude) {
  return typeof latitude === 'number' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && typeof longitude === 'number' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function validMapPin(point) {
  return (point.latitude === undefined && point.longitude === undefined) || validCoordinates(point.latitude, point.longitude);
}

export function assertMapPin(point) {
  if (point && typeof point === 'object' && !validMapPin(point)) {
    throw Object.assign(new Error('Provide both valid latitude and longitude, or leave both empty'), { statusCode: 400 });
  }
}

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
