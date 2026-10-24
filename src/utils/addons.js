import { ProductsCollection } from '../db/models/products.js';

export const ADDON_TYPES = ['sauce', 'ginger', 'wasabi'];

// Which catalog categories grant free sauce/ginger/wasabi, and how many
// units of each per item added — per the business rule confirmed with the
// store owner: every roll-like category gives 1 each, a set gives 4 each,
// drinks/other give none. Scales with quantity (2 rolls -> 2 free each).
const SET_CATEGORIES = new Set(['sets']);
const ROLL_LIKE_CATEGORIES = new Set([
  'rolls',
  'hotRolls',
  'bigRolls',
  'maki',
  'sushi',
  'hunkans',
]);

const freeUnitsPerItem = (category) => {
  if (SET_CATEGORIES.has(category)) return 4;
  if (ROLL_LIKE_CATEGORIES.has(category)) return 1;
  return 0;
};

// Loads the 3 real sauce/ginger/wasabi catalog products, keyed by
// addonType, so a brand-new free addon line can be created with their
// real name/price/image/weight instead of inventing one — priced for the
// given city, same as any other product.
export const loadAddonCatalogForCity = async (city) => {
  const products = await ProductsCollection.find({
    addonType: { $in: ADDON_TYPES },
  });
  const priceField = city === 'kharkiv' ? 'priceKharkov' : 'priceKiev';

  const catalog = {};
  for (const product of products) {
    catalog[product.addonType] = {
      product_id: String(product._id),
      productName: product.name,
      price: product[priceField],
      image: product.images?.[0] || '',
      weight: product.weight,
      addonType: product.addonType,
      category: product.category,
    };
  }
  return catalog;
};

// Recomputes free-vs-paid sauce/ginger/wasabi quantities from the current
// main items (rolls/sets/etc) in the cart, without resetting quantities
// the customer deliberately changed by hand.
//
// For each addon type: newFree is recalculated from the current main
// items. The line's quantity is shifted by exactly the change in free
// allowance (delta = newFree - oldFree) rather than being reset to
// newFree outright — so if the customer already bumped it up or down
// manually, that manual adjustment survives a later roll/set change
// instead of being overwritten (section 4.3's requirement). A line whose
// quantity lands at 0 is dropped rather than kept as an empty row.
//
// Only called after a MAIN item changes (see services/cart.js) — a direct
// edit of an addon line itself never touches `freeTotals`, so it always
// round-trips through here as a no-op (delta 0), including a deliberate
// removal to zero, which is never silently re-granted on its own.
export const recomputeAddons = (items, addonCatalog) => {
  const freeTotals = { sauce: 0, ginger: 0, wasabi: 0 };
  for (const item of items) {
    if (item.addonType) continue;
    const free = freeUnitsPerItem(item.category) * item.quantity;
    for (const type of ADDON_TYPES) freeTotals[type] += free;
  }

  const result = [];
  const handled = new Set();

  for (const item of items) {
    if (!item.addonType) {
      result.push(item);
      continue;
    }
    if (handled.has(item.addonType)) continue;
    handled.add(item.addonType);

    const newFree = freeTotals[item.addonType] || 0;
    const oldFree = item.freeQuantity || 0;
    const delta = newFree - oldFree;
    const quantity = Math.max(0, item.quantity + delta);

    if (quantity === 0) continue;
    result.push({ ...item, quantity, freeQuantity: Math.min(newFree, quantity) });
  }

  for (const type of ADDON_TYPES) {
    if (handled.has(type)) continue;
    const newFree = freeTotals[type] || 0;
    if (newFree > 0 && addonCatalog?.[type]) {
      result.push({ ...addonCatalog[type], quantity: newFree, freeQuantity: newFree });
    }
  }

  return result;
};

// Free units within the addon's own allowance cost nothing — only the
// quantity beyond it is charged, at the item's normal price. Applies the
// same way to every line; for a main item freeQuantity is always 0, so
// this is just item.quantity.
export const getChargeableQuantity = (item) =>
  Math.max(0, item.quantity - (item.freeQuantity || 0));
