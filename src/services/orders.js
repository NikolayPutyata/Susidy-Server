import createHttpError from 'http-errors';
import { OrdersCollection } from '../db/models/orders.js';

export const getTodayOrders = async () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return await OrdersCollection.find({
    createdAt: { $gte: start, $lt: end },
  }).sort({ createdAt: -1 });
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
