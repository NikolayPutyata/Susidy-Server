import createHttpError from 'http-errors';
import { OrdersCollection } from '../db/models/orders.js';

// day: 'today' | 'yesterday'. pickupPointId optionally narrows to orders
// picked up from that one point (delivery orders aren't tied to a point
// yet, so they're excluded whenever a point filter is applied).
export const getOrdersByDay = async ({ day = 'today', pickupPointId } = {}) => {
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

  return await OrdersCollection.find(match).sort({ createdAt: -1 });
};

export const getOrdersByPhone = async (phoneNumber) => {
  if (!phoneNumber) {
    throw createHttpError(400, 'phone query parameter is required');
  }

  return await OrdersCollection.find({
    phoneNumber: { $regex: phoneNumber },
  }).sort({ createdAt: -1 });
};

export const getMyOrders = async (userId) => {
  return await OrdersCollection.find({ user_id: userId }).sort({
    createdAt: -1,
  });
};
