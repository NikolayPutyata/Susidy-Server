import { ProductsCollection } from '../db/models/products.js';

export const ADDON_TYPES = ['sauce', 'ginger', 'wasabi'];

// Free sauce/ginger/wasabi per the store owner's rule: each roll-like
// item earns 1 free unit of every addon, each set earns 4, scaling with
// quantity — but capped at 8 free units per addon type, since nobody
// actually wants e.g. 20 sauces for 5 sets. Drinks/other earn none.
const SET_CATEGORIES = new Set(['sets']);
const ROLL_LIKE_CATEGORIES = new Set([
  'rolls',
  'hotRolls',
  'bigRolls',
  'maki',
  'sushi',
  'hunkans',
]);

const FREE_ADDON_CAP = 8;

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
//
// Output order is always main items first (in the order they were
// added), then the addon lines in a fixed sauce/ginger/wasabi order — so
// the cart and order lists never interleave addons between dishes.
export const recomputeAddons = (items, addonCatalog) => {
  const earned = items.reduce(
    (sum, item) =>
      item.addonType ? sum : sum + freeUnitsPerItem(item.category) * item.quantity,
    0,
  );
  const free = Math.min(FREE_ADDON_CAP, earned);

  const mainItems = [];
  const addonLines = {};
  const handled = new Set();

  for (const item of items) {
    if (!item.addonType) {
      mainItems.push(item);
      continue;
    }
    if (handled.has(item.addonType)) continue;
    handled.add(item.addonType);

    const oldFree = item.freeQuantity || 0;
    const quantity = Math.max(0, item.quantity + free - oldFree);

    if (quantity === 0) continue;
    addonLines[item.addonType] = {
      ...item,
      quantity,
      freeQuantity: Math.min(free, quantity),
    };
  }

  for (const type of ADDON_TYPES) {
    if (handled.has(type)) continue;
    if (free > 0 && addonCatalog?.[type]) {
      addonLines[type] = { ...addonCatalog[type], quantity: free, freeQuantity: free };
    }
  }

  return [...mainItems, ...ADDON_TYPES.map((type) => addonLines[type]).filter(Boolean)];
};

// Free units within the addon's own allowance cost nothing — only the
// quantity beyond it is charged, at the item's normal price. Applies the
// same way to every line; for a main item freeQuantity is always 0, so
// this is just item.quantity.
export const getChargeableQuantity = (item) =>
  Math.max(0, item.quantity - (item.freeQuantity || 0));
