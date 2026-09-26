import {
  getAllUsers,
  getUsersWhoOrderedInRange,
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

const escapeCsvValue = (value) => {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const exportUsersController = async (req, res) => {
  const { from, to } = req.query;

  const users = await getUsersWhoOrderedInRange({ from, to });

  const header = ["Ім'я", 'Номер', 'Місто'].join(',');
  const rows = users.map((user) =>
    [user.name, user.phoneNumber, user.city || '']
      .map(escapeCsvValue)
      .join(','),
  );
  // Leading BOM so Excel opens the UTF-8 (Cyrillic) file correctly.
  const csv = '﻿' + [header, ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
  res.status(200).send(csv);
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
