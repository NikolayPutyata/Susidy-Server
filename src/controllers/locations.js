import createHttpError from 'http-errors';
import { findNearestPoint } from '../services/locations.js';

// Public, read-only: lets the client show a live "this point will prepare
// your order" hint while the customer is picking a delivery address. The
// value used for actual Telegram routing is recomputed independently,
// server-side, at order creation — this endpoint is UI feedback only, not
// something the client's own claim is trusted for later.
export const getNearestPointController = async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const { city } = req.query;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw createHttpError(400, 'lat and lng query parameters are required');
  }

  if (city !== 'kyiv' && city !== 'kharkiv') {
    throw createHttpError(400, 'city must be "kyiv" or "kharkiv"');
  }

  const nearest = findNearestPoint({ lat, lng, city });

  res.status(200).json({ status: 200, data: nearest });
};
