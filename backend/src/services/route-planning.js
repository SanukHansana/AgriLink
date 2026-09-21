import { validCoordinates } from '../utils/validation.js';

export function airDistance(a, b) {
  const rad = (angle) => angle * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function planRoute(job) {
  const pickups = job.pickupPoints.map((point, index) => ({ ...point.toObject?.() ?? point, kind: 'pickup', index })).filter((point) => !point.completedAt);
  const dropoffs = (job.dropoffPoints?.length ? job.dropoffPoints : [job.destination]).map((point, index) => ({ ...point.toObject?.() ?? point, kind: 'dropoff', index })).filter((point) => !point.completedAt);
  const all = [...pickups, ...dropoffs];
  if (!all.length || all.some((point) => !validCoordinates(point.latitude, point.longitude))) return { stops: all, optimized: false, message: 'Save a map pin for every remaining stop to suggest a route. Google Maps can still navigate using addresses.' };
  let current = job.driverLocation && validCoordinates(job.driverLocation.latitude, job.driverLocation.longitude) ? job.driverLocation : all[0];
  const route = []; let total = 0;
  // Keep collection ahead of delivery; nearest-neighbour is a suggestion, not road optimization.
  for (const phase of [pickups, dropoffs]) {
    const remaining = [...phase];
    while (remaining.length) {
      remaining.sort((a, b) => airDistance(current, a) - airDistance(current, b));
      const next = remaining.shift(); total += airDistance(current, next); route.push(next); current = next;
    }
  }
  return { stops: route, optimized: true, estimatedAirDistanceKm: Number(total.toFixed(1)), message: 'Suggested stop order uses straight-line distance. Open Google Maps for road distance, travel time and traffic.' };
}
