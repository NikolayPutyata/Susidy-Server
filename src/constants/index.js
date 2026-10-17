export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const SESSION_DURATION = 60 * 24 * 60 * 60 * 1000;

export const CITY_LABELS = { kyiv: 'Київ', kharkiv: 'Харків' };

// Mirrors the client's LOCATIONS (src/lib/constants.js) — kept here too
// since the server validates pickupPointId independently (stop toggles,
// order creation) and needs lat/lng itself to compute the nearest point
// for a delivery address without trusting the client's claim.
//
// lat/lng are seeded once via Google Geocoding once the Maps API key is
// available (see services/locations.js) — until then they're null, and
// findNearestPoint() simply can't pick a point for that city yet (degrades
// to "no point determined", not a wrong one).
export const PICKUP_POINTS = [
  {
    id: 'kyiv-berestejskyi',
    city: 'kyiv',
    address: 'просп. Берестейський, 9',
    lat: null,
    lng: null,
  },
  {
    id: 'kyiv-dragomanova',
    city: 'kyiv',
    address: 'вул. Драгоманова, 2А',
    lat: null,
    lng: null,
  },
  {
    id: 'kharkiv-valentynivska',
    city: 'kharkiv',
    address: 'вул. Валентинівська, 31В',
    lat: null,
    lng: null,
  },
  {
    id: 'kharkiv-divisions',
    city: 'kharkiv',
    address: 'вул. Харківських дивізій, 11/2',
    lat: null,
    lng: null,
  },
  {
    id: 'kharkiv-svobody',
    city: 'kharkiv',
    address: 'просп. Людвіга Свободи, 33',
    lat: null,
    lng: null,
  },
];

export const PICKUP_POINT_IDS = PICKUP_POINTS.map((point) => point.id);
