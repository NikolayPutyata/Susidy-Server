import { addToCart, createOrder, getCart } from '../services/cart.js';

export const getCartController = async (req, res) => {
  const { session_id } = req.params;

  const cart = await getCart(session_id);

  res
    .status(200)
    .json({ status: 200, session_id, userId: cart.user_id, data: cart.items });
};

export const addToCartController = async (req, res) => {
  const { session_id, product_id, quantity, productName, price } = req.body;

  const cart = await addToCart(
    session_id,
    product_id,
    quantity,
    productName,
    price,
  );

  res.status(200).json({ status: 200, data: cart });
};

export const createOrderController = async (req, res) => {
  const { session_id, name, phoneNumber } = req.body;

  const order = await createOrder(session_id, name, phoneNumber);

  res.status(201).json({ status: 201, data: order });
};
