import {
  addFavoriteProduct,
  getAllUsers,
  getUsersWhoOrderedInRange,
  removeFavoriteProduct,
  searchUsersByPhone,
  setUserBirthday,
  updateUserDiscount,
} from '../services/users.js';
import { CITY_LABELS } from '../constants/index.js';

export const getAllUsersController = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 10;

  const result = await getAllUsers({
    page,
    perPage,
    sortBy: req.query.sortBy,
    sortDir: req.query.sortDir,
  });

  res.status(200).json({ status: 200, ...result });
};

export const searchUsersController = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 10;

  const result = await searchUsersByPhone({
    phoneNumber: req.query.phone,
    page,
    perPage,
    sortBy: req.query.sortBy,
    sortDir: req.query.sortDir,
  });

  res.status(200).json({ status: 200, ...result });
};

// Ukrainian/European Excel treats "," as the decimal separator, so a
// comma-delimited CSV opened directly (double-click) dumps every column
// into one — ";" is the delimiter Excel actually expects in that locale.
const CSV_DELIMITER = ';';

const escapeCsvValue = (value) => {
  const str = String(value ?? '');
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export const exportUsersController = async (req, res) => {
  const { from, to, city } = req.query;

  const users = await getUsersWhoOrderedInRange({ from, to, city });

  const header = ["Ім'я", 'Телефон', 'Місто', 'Кількість замовлень', 'Знижка, %'].join(
    CSV_DELIMITER,
  );
  const rows = users.map((user) => {
    const cityLabel = user.orderedCities
      .map((c) => CITY_LABELS[c] || c)
      .join(', ');

    return [user.name, user.phoneNumber, cityLabel, user.ordersCount, user.discount]
      .map(escapeCsvValue)
      .join(CSV_DELIMITER);
  });
  // Leading BOM so Excel opens the UTF-8 (Cyrillic) file correctly.
  const csv = '﻿' + [header, ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
  res.status(200).send(csv);
};

export const updateMyBirthdayController = async (req, res) => {
  const user = await setUserBirthday(req.user._id, req.body.birthday);

  res.status(200).json({ status: 200, data: user });
};

export const addMyFavoriteController = async (req, res) => {
  const user = await addFavoriteProduct(req.user._id, req.params.productId);

  res.status(200).json({ status: 200, data: user });
};

export const removeMyFavoriteController = async (req, res) => {
  const user = await removeFavoriteProduct(req.user._id, req.params.productId);

  res.status(200).json({ status: 200, data: user });
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
