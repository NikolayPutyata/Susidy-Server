import createHttpError from 'http-errors';
import { OrdersCollection } from '../db/models/orders.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const paginateOrders = async (match, { page = 1, perPage = 10 } = {}) => {
  const skip = (page - 1) * perPage;

  const [data, totalItems] = await Promise.all([
    OrdersCollection.find(match).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    OrdersCollection.countDocuments(match),
  ]);

  return {
    data,
    page,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
  };
};

// day: 'today' | 'yesterday'. pickupPointId optionally narrows to orders
// prepared by that one point — pickup orders the customer chose directly,
// delivery orders assigned the nearest point from their geocoded address.
// A delivery order without a resolved point (no coordinates yet) simply
// has no pickupPointId, so it's excluded whenever a point filter is
// applied, same as before this field existed for delivery.
export const getOrdersByDay = async ({
  day = 'today',
  pickupPointId,
  page = 1,
  perPage = 10,
} = {}) => {
  const dayOffset = day === 'yesterday' ? 1 : 0;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayOffset + 1,
  );

  const match = { createdAt: { $gte: start, $lt: end } };
  if (pickupPointId) match.pickupPointId = pickupPointId;

  return paginateOrders(match, { page, perPage });
};

export const getOrdersByPhone = async ({ phoneNumber, page = 1, perPage = 10 } = {}) => {
  if (!phoneNumber) {
    throw createHttpError(400, 'phone query parameter is required');
  }

  return paginateOrders(
    { phoneNumber: { $regex: escapeRegex(phoneNumber) } },
    { page, perPage },
  );
};

export const getMyOrders = async (userId) => {
  return await OrdersCollection.find({ user_id: userId }).sort({
    createdAt: -1,
  });
};
