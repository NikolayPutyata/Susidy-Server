import createHttpError from 'http-errors';
import { OrdersCollection } from '../db/models/orders.js';

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
// picked up from that one point (delivery orders aren't tied to a point
// yet, so they're excluded whenever a point filter is applied).
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

  return paginateOrders({ phoneNumber: { $regex: phoneNumber } }, { page, perPage });
};

export const getMyOrders = async (userId) => {
  return await OrdersCollection.find({ user_id: userId }).sort({
    createdAt: -1,
  });
};
