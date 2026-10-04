type Stop = { latitude?: number; longitude?: number; addressLine?: string; city?: string; district?: string };
function destination(point: Stop) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    ? `${point.latitude},${point.longitude}`
    : [point.addressLine, point.city, point.district, 'Sri Lanka'].filter(Boolean).join(', ');
}

export function googleMapsDirections(stops: Stop[]) {
  if (!stops.length) throw new Error('There are no remaining stops for this delivery.');
  // Mobile Maps URLs support up to three waypoints. Larger jobs open in segments.
  const points = stops.slice(0, 4);
  const makeUrl = () => `https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=${encodeURIComponent(destination(points[points.length - 1]))}${points.length > 1 ? `&waypoints=${encodeURIComponent(points.slice(0, -1).map(destination).join('|'))}` : ''}`;
  while (makeUrl().length > 2048 && points.length > 1) points.pop();
  if (makeUrl().length > 2048) throw new Error('This address is too long for Google Maps. Use a saved map pin.');
  return { url: makeUrl(), stopCount: points.length };
}
