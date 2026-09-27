import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { OrdersCollection } from '../db/models/orders.js';

export const findOrCreateUserByPhone = async ({ name, phoneNumber }) => {
  let user = await UsersCollection.findOne({ phoneNumber });

  if (!user) {
    user = await UsersCollection.create({ name, phoneNumber });
  }

  return user;
};

const attachOrderCounts = async (users) => {
  const ids = users.map((user) => user._id);

  const counts = await OrdersCollection.aggregate([
    { $match: { user_id: { $in: ids } } },
    { $group: { _id: '$user_id', count: { $sum: 1 } } },
  ]);

  const countByUserId = new Map(
    counts.map((entry) => [String(entry._id), entry.count]),
  );

  return users.map((user) => ({
    ...user.toJSON(),
    ordersCount: countByUserId.get(String(user._id)) || 0,
  }));
};

const paginateUsers = async (match, { page = 1, perPage = 10 } = {}) => {
  const skip = (page - 1) * perPage;

  const [users, totalItems] = await Promise.all([
    UsersCollection.find(match).sort({ createdAt: -1 }).skip(skip).limit(perPage),
    UsersCollection.countDocuments(match),
  ]);

  return {
    data: await attachOrderCounts(users),
    page,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
  };
};

export const getAllUsers = async ({ page = 1, perPage = 10 } = {}) =>
  paginateUsers({}, { page, perPage });

export const searchUsersByPhone = async ({ phoneNumber, page = 1, perPage = 10 } = {}) => {
  if (!phoneNumber) {
    throw createHttpError(400, 'phone query parameter is required');
  }

  return paginateUsers({ phoneNumber: { $regex: phoneNumber } }, { page, perPage });
};

export const updateUserDiscount = async (userId, discount) => {
  const user = await UsersCollection.findByIdAndUpdate(
    userId,
    { discount },
    { new: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return user;
};

// Used by the admin export: "customers" means people who placed at least
// one order, optionally narrowed to those who ordered within [from, to]
// and/or in one city. Omitting a filter means no restriction on it.
export const getUsersWhoOrderedInRange = async ({ from, to, city } = {}) => {
  const match = {};

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  if (city) match.city = city;

  const userIds = await OrdersCollection.distinct('user_id', match);

  return await UsersCollection.find({ _id: { $in: userIds } }).sort({
    name: 1,
  });
};
