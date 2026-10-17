export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const SESSION_DURATION = 60 * 24 * 60 * 60 * 1000;

export const CITY_LABELS = { kyiv: 'Київ', kharkiv: 'Харків' };

// Mirrors the client's LOCATIONS (src/lib/constants.js) — kept here too
// since the server validates pickupPointId independently (stop toggles,
// order creation) and needs lat/lng itself to compute the nearest point
// for a delivery address without trusting the client's claim.
//
// Coordinates provided directly by the business owner (Google Maps "What's
// here" pin), not geocoded from the address string.
export const PICKUP_POINTS = [
  {
    id: 'kyiv-berestejskyi',
    city: 'kyiv',
    address: 'просп. Берестейський, 9',
    lat: 50.447806,
    lng: 30.484361,
  },
  {
    id: 'kyiv-dragomanova',
    city: 'kyiv',
    address: 'вул. Драгоманова, 2А',
    lat: 50.417611,
    lng: 30.633111,
  },
  {
    id: 'kharkiv-valentynivska',
    city: 'kharkiv',
    address: 'вул. Валентинівська, 31В',
    lat: 50.013667,
    lng: 36.342028,
  },
  {
    id: 'kharkiv-divisions',
    city: 'kharkiv',
    address: 'вул. Харківських дивізій, 11/2',
    lat: 49.957556,
    lng: 36.332139,
  },
  {
    id: 'kharkiv-svobody',
    city: 'kharkiv',
    address: 'просп. Людвіга Свободи, 33',
    lat: 50.051556,
    lng: 36.204833,
  },
];

export const PICKUP_POINT_IDS = PICKUP_POINTS.map((point) => point.id);
