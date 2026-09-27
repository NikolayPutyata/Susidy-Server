import {
  getMyOrders,
  getOrdersByDay,
  getOrdersByPhone,
} from '../services/orders.js';

export const getOrdersByDayController = async (req, res) => {
  const { day, pickupPointId } = req.query;

  const orders = await getOrdersByDay({ day, pickupPointId });

  res.status(200).json({ status: 200, data: orders });
};

export const searchOrdersController = async (req, res) => {
  const orders = await getOrdersByPhone(req.query.phone);

  res.status(200).json({ status: 200, data: orders });
};

export const getMyOrdersController = async (req, res) => {
  const orders = await getMyOrders(req.user._id);

  res.status(200).json({ status: 200, data: orders });
};
