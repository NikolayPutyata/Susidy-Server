import { PICKUP_POINTS } from '../constants/index.js';

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineDistanceKm = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

// Picks the closest pickup point to (lat, lng) among the points in that
// city — straight-line distance, which is plenty accurate for choosing
// between a handful of fixed points in the same city (no need for a paid
// routing API). Returns null if the city has no point with known
// coordinates yet; callers treat that the same as "couldn't determine a
// point" rather than guessing.
export const findNearestPoint = ({ lat, lng, city }) => {
  const candidates = PICKUP_POINTS.filter(
    (point) =>
      point.city === city &&
      typeof point.lat === 'number' &&
      typeof point.lng === 'number',
  );

  if (candidates.length === 0) return null;

  let nearest = null;
  let nearestDistanceKm = Infinity;

  for (const point of candidates) {
    const distanceKm = haversineDistanceKm({ lat, lng }, point);
    if (distanceKm < nearestDistanceKm) {
      nearest = point;
      nearestDistanceKm = distanceKm;
    }
  }

  return { pointId: nearest.id, distanceKm: nearestDistanceKm };
};
