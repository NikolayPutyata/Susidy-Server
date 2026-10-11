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

  const stats = await OrdersCollection.aggregate([
    { $match: { user_id: { $in: ids } } },
    {
      $group: {
        _id: '$user_id',
        count: { $sum: 1 },
        totalSpent: { $sum: '$total' },
      },
    },
  ]);

  const statsByUserId = new Map(stats.map((entry) => [String(entry._id), entry]));

  return users.map((user) => {
    const stat = statsByUserId.get(String(user._id));
    return {
      ...user.toJSON(),
      ordersCount: stat?.count || 0,
      totalSpent: stat?.totalSpent || 0,
    };
  });
};

const SORTABLE_FIELDS = ['ordersCount', 'totalSpent'];

// Sorting by a computed field can't be done after the fact like
// attachOrderCounts does for a single already-fetched page (you'd be
// sorting only within that page) — it has to be computed, sorted, and
// paginated in one aggregation so "largest first" actually looks across
// every customer, not just the current page.
const paginateUsers = async (
  match,
  { page = 1, perPage = 20, sortBy = 'createdAt', sortDir = 'desc' } = {},
) => {
  const skip = (page - 1) * perPage;
  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = sortDir === 'asc' ? 1 : -1;

  const [result] = await UsersCollection.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'user_id',
        as: 'userOrders',
      },
    },
    {
      $addFields: {
        ordersCount: { $size: '$userOrders' },
        totalSpent: { $sum: '$userOrders.total' },
      },
    },
    { $project: { userOrders: 0, password: 0 } },
    {
      $facet: {
        data: [
          { $sort: { [sortField]: sortOrder } },
          { $skip: skip },
          { $limit: perPage },
        ],
        totalCount: [{ $count: 'count' }],
      },
    },
  ]);

  const totalItems = result.totalCount[0]?.count || 0;

  return {
    data: result.data,
    page,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
  };
};

export const getAllUsers = async ({
  page = 1,
  perPage = 20,
  sortBy,
  sortDir,
} = {}) => paginateUsers({}, { page, perPage, sortBy, sortDir });

export const searchUsersByPhone = async ({
  phoneNumber,
  page = 1,
  perPage = 20,
  sortBy,
  sortDir,
} = {}) => {
  if (!phoneNumber) {
    throw createHttpError(400, 'phone query parameter is required');
  }

  return paginateUsers(
    { phoneNumber: { $regex: phoneNumber } },
    { page, perPage, sortBy, sortDir },
  );
};

// The client can only ever set this once — any later attempt (even to the
// same value) is rejected rather than silently ignored, so the user can't
// be surprised by a formerly-editable field quietly becoming read-only.
export const setUserBirthday = async (userId, birthday) => {
  const user = await UsersCollection.findById(userId);

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  if (user.birthday) {
    throw createHttpError(
      409,
      'День народження вже вказано і його не можна змінити',
    );
  }

  user.birthday = birthday;
  await user.save();

  return user;
};

export const addFavoriteProduct = async (userId, productId) => {
  const user = await UsersCollection.findByIdAndUpdate(
    userId,
    { $addToSet: { favorites: productId } },
    { new: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return user;
};

export const removeFavoriteProduct = async (userId, productId) => {
  const user = await UsersCollection.findByIdAndUpdate(
    userId,
    { $pull: { favorites: productId } },
    { new: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return user;
};

export const updateUserProfile = async (userId, payload) => {
  const user = await UsersCollection.findByIdAndUpdate(userId, payload, {
    new: true,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  return user;
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
//
// The set of matched users was always correct (it's exactly those with a
// matching order), but each user's *displayed* city used to come from the
// user's own `city` field — set once at registration (if at all) and
// completely unrelated to which city's filter actually matched them. A
// guest checkout never sets it, so most rows showed a blank or stale city
// regardless of which city was exported. Returning each user's actual
// ordered-in cities (scoped to the same filter) fixes that at the source.
export const getUsersWhoOrderedInRange = async ({ from, to, city } = {}) => {
  const match = {};

  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  if (city) match.city = city;

  const grouped = await OrdersCollection.aggregate([
    { $match: match },
    { $group: { _id: '$user_id', cities: { $addToSet: '$city' } } },
  ]);

  const citiesByUserId = new Map(
    grouped.map((entry) => [String(entry._id), entry.cities]),
  );

  const users = await UsersCollection.find({
    _id: { $in: grouped.map((entry) => entry._id) },
  }).sort({ name: 1 });

  const withCounts = await attachOrderCounts(users);

  return withCounts.map((user) => ({
    ...user,
    orderedCities: citiesByUserId.get(String(user._id)) || [],
  }));
};
