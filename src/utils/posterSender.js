import { ProductsCollection } from '../db/models/products.js';

// Poster POS: joinposter.com. A personal access token (Settings → Access →
// Integrations → Personal integration in the Poster admin panel) is enough
// for a single-account integration — no OAuth app needed. Both env vars are
// optional: until they're set, sendOrderToPoster is a silent no-op, so this
// can ship and sit dormant until the business provides real credentials.
const POSTER_ACCOUNT_NAME = process.env.POSTER_ACCOUNT_NAME;
const POSTER_ACCESS_TOKEN = process.env.POSTER_ACCESS_TOKEN;

// Same per-point env var pattern as utils/telegramSender.js's pointBots —
// each of the 5 pickup points is a separate "spot" in Poster with its own
// numeric id, which only exists inside the business's Poster account (not
// something we can derive or guess). A point left unmapped here just means
// orders resolved to it aren't pushed to Poster yet.
const pointSpotIds = {
  'kyiv-berestejskyi': process.env.POSTER_SPOT_ID_KYIV_BERESTEJSKYI,
  'kyiv-dragomanova': process.env.POSTER_SPOT_ID_KYIV_DRAGOMANOVA,
  'kharkiv-valentynivska': process.env.POSTER_SPOT_ID_KHARKIV_VALENTYNIVSKA,
  'kharkiv-divisions': process.env.POSTER_SPOT_ID_KHARKIV_DIVISIONS,
  'kharkiv-svobody': process.env.POSTER_SPOT_ID_KHARKIV_SVOBODY,
};

const isConfigured = () => Boolean(POSTER_ACCOUNT_NAME && POSTER_ACCESS_TOKEN);

const callPosterApi = async (method, params) => {
  const url = `https://${POSTER_ACCOUNT_NAME}.joinposter.com/api/${method}?token=${POSTER_ACCESS_TOKEN}&format=json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => null);

  // Poster returns HTTP 200 with an `error` key for most API-level
  // failures (bad spot_id, unknown product_id, etc.) rather than a 4xx —
  // surface that as a thrown error same as a transport failure, so the
  // caller's single catch block handles both.
  if (!res.ok || data?.error) {
    throw new Error(
      `Poster API ${method} failed: ${data?.error?.message || data?.error || res.statusText}`,
    );
  }

  return data?.response;
};

// Delivery orders without a resolved pickupPointId (address didn't match
// any zone/point yet — see services/locations.js) have nowhere in Poster
// to land, so they're skipped the same way a pickup point without its own
// Telegram bot falls back instead of vanishing — except here there's no
// sensible fallback "spot", so the order simply isn't pushed.
export const sendOrderToPoster = async (order) => {
  if (!isConfigured()) return;

  const spotId = pointSpotIds[order.pickupPointId];
  if (!spotId) {
    console.warn(
      `Poster: no spot_id configured for pickupPointId="${order.pickupPointId || 'none'}" — order ${order._id} not pushed`,
    );
    return;
  }

  const productIds = order.items.map((item) => item.product_id);
  const products = await ProductsCollection.find(
    { _id: { $in: productIds } },
    { posterProductId: 1 },
  );
  const posterIdByProductId = new Map(
    products.map((p) => [String(p._id), p.posterProductId]),
  );

  const unmapped = order.items.filter(
    (item) => !posterIdByProductId.get(item.product_id),
  );
  if (unmapped.length > 0) {
    console.warn(
      `Poster: order ${order._id} has items with no posterProductId set (${unmapped
        .map((i) => i.productName)
        .join(', ')}) — not pushed`,
    );
    return;
  }

  const [firstName, ...rest] = (order.name || '').trim().split(/\s+/);

  const addressLine = order.fulfillment === 'delivery'
    ? order.building
      ? `вул. ${order.street}, буд. ${order.building}`
      : order.street
    : order.pickupAddress;

  await callPosterApi('incomingOrders.createIncomingOrder', {
    spot_id: Number(spotId),
    first_name: firstName || order.name,
    last_name: rest.join(' ') || undefined,
    phone: order.phoneNumber,
    address: addressLine,
    comment: [
      `Прибори: ${order.cutlery ?? 0}${order.trainingChopsticks ? ' + навчальні палички' : ''}`,
      order.details,
    ]
      .filter(Boolean)
      .join('. '),
    products: order.items.map((item) => ({
      product_id: Number(posterIdByProductId.get(item.product_id)),
      count: item.quantity,
    })),
  });
};
