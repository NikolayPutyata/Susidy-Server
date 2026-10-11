export const FIFTEEN_MINUTES = 15 * 60 * 1000;
export const SESSION_DURATION = 60 * 24 * 60 * 60 * 1000;

export const CITY_LABELS = { kyiv: 'Київ', kharkiv: 'Харків' };

// Mirrors the client's LOCATIONS (src/lib/constants.js) — kept here too
// since the server validates pickupPointId independently (stop toggles,
// order creation) and has no access to the client's module.
export const PICKUP_POINT_IDS = [
  'kyiv-berestejskyi',
  'kyiv-dragomanova',
  'kharkiv-valentynivska',
  'kharkiv-divisions',
  'kharkiv-svobody',
];
