import { PICKUP_POINTS } from '../constants/index.js';
import { DELIVERY_ZONES } from '../constants/deliveryZones.js';

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

// Standard ray-casting point-in-polygon test: counts how many times a ray
// from the point going in +lng direction crosses the polygon's edges — odd
// means inside. `polygon` is a list of {lat, lng} vertices in order; it
// doesn't matter whether the ring is explicitly closed (first point
// repeated at the end) or not.
const isPointInPolygon = ({ lat, lng }, polygon) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vi = polygon[i];
    const vj = polygon[j];

    const crosses =
      vi.lat > lat !== vj.lat > lat &&
      lng < ((vj.lng - vi.lng) * (lat - vi.lat)) / (vj.lat - vi.lat) + vi.lng;

    if (crosses) inside = !inside;
  }

  return inside;
};

// A straight-line "nearest point" can pick the wrong one right along a
// city's real dividing lines (a river, a rail line, a highway) — a street
// can be geographically closer to point A while every normal delivery
// route to it actually goes through point B's side of town. Zones are
// hand-drawn polygons (see constants/deliveryZones.js) that take priority
// over distance for exactly that reason. If the zones happen to overlap,
// whichever point comes first in PICKUP_POINTS wins — zones are meant not
// to overlap, this is just a defined tiebreaker, not a feature.
export const findZonePoint = ({ lat, lng, city }) => {
  for (const point of PICKUP_POINTS) {
    if (point.city !== city) continue;

    const zone = DELIVERY_ZONES[point.id];
    if (!zone) continue;

    if (isPointInPolygon({ lat, lng }, zone)) {
      return { pointId: point.id, distanceKm: null, viaZone: true };
    }
  }

  return null;
};

// The authoritative "which point serves this address" lookup — zones
// first, then the haversine fallback for anything outside every zone
// (including every point in a city with no zone drawn yet at all).
export const findServingPoint = (args) => findZonePoint(args) || findNearestPoint(args);
