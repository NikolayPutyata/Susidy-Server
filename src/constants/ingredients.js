// The fixed ingredient dictionary the admin picks from (chip selector in
// the admin product form) — products store these ids, never free text, so
// the roll filters on the client match exactly. Mirrors the client's
// src/lib/ingredients.js; add a new ingredient in both places.
export const INGREDIENT_IDS = [
  'salmon',
  'tuna',
  'eel',
  'shrimp',
  'crab',
  'chicken',
  'cheese',
  'mayo',
  'avocado',
  'cucumber',
  'tobiko',
  'sesame',
];
