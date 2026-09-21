import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';

export const findOrCreateUserByPhone = async ({ name, phoneNumber }) => {
  let user = await UsersCollection.findOne({ phoneNumber });

  if (!user) {
    user = await UsersCollection.create({ name, phoneNumber });
  }

  return user;
};

export const getAllUsers = async ({ page = 1, perPage = 20 } = {}) => {
  const skip = (page - 1) * perPage;

  const [data, totalItems] = await Promise.all([
    UsersCollection.find().sort({ createdAt: -1 }).skip(skip).limit(perPage),
    UsersCollection.countDocuments(),
  ]);

  return {
    data,
    page,
    perPage,
    totalItems,
    totalPages: Math.ceil(totalItems / perPage),
  };
};

export const searchUsersByPhone = async (phoneNumber) => {
  if (!phoneNumber) {
    throw createHttpError(400, 'phone query parameter is required');
  }

  return await UsersCollection.find({
    phoneNumber: { $regex: phoneNumber },
  }).sort({ createdAt: -1 });
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
