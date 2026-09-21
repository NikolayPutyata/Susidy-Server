import { getOrdersByPhone, getTodayOrders } from '../services/orders.js';

export const getTodayOrdersController = async (req, res) => {
  const orders = await getTodayOrders();

  res.status(200).json({ status: 200, data: orders });
};

export const searchOrdersController = async (req, res) => {
  const orders = await getOrdersByPhone(req.query.phone);

  res.status(200).json({ status: 200, data: orders });
};
