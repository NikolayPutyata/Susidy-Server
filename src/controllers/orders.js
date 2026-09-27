import {
  getMyOrders,
  getOrdersByDay,
  getOrdersByPhone,
} from '../services/orders.js';

export const getOrdersByDayController = async (req, res) => {
  const { day, pickupPointId } = req.query;
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 10;

  const result = await getOrdersByDay({ day, pickupPointId, page, perPage });

  res.status(200).json({ status: 200, ...result });
};

export const searchOrdersController = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const perPage = Number(req.query.perPage) || 10;

  const result = await getOrdersByPhone({
    phoneNumber: req.query.phone,
    page,
    perPage,
  });

  res.status(200).json({ status: 200, ...result });
};

export const getMyOrdersController = async (req, res) => {
  const orders = await getMyOrders(req.user._id);

  res.status(200).json({ status: 200, data: orders });
};
