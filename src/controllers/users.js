import {
  getAllUsers,
  searchUsersByPhone,
  updateUserDiscount,
} from '../services/users.js';

export const getAllUsersController = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 20;

  const result = await getAllUsers({ page, perPage });

  res.status(200).json({ status: 200, ...result });
};

export const searchUsersController = async (req, res) => {
  const users = await searchUsersByPhone(req.query.phone);

  res.status(200).json({ status: 200, data: users });
};

export const updateUserDiscountController = async (req, res) => {
  const { id } = req.params;
  const { discount } = req.body;

  const user = await updateUserDiscount(id, discount);

  res.status(200).json({
    status: 200,
    message: 'Discount updated successfully',
    data: user,
  });
};
