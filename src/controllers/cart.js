import {
  addToCart,
  createOrder,
  getCart,
  removeItemFromCart,
  updateCart,
} from '../services/cart.js';

export const getCartController = async (req, res) => {
  const { cart_id } = req.params;

  const cart = await getCart(cart_id);

  res.status(200).json({ status: 200, cart_id, data: cart });
};

export const addToCartController = async (req, res) => {
  const reqData = {
    session_id: req.body.session_id,
    product_id: req.body.product_id,
    quantity: req.body.quantity,
    productName: req.body.productName,
    price: req.body.price,
  };

  const cart = await addToCart(reqData, req.user);

  res.status(200).json({
    status: 200,
    session_id: req.body.session_id,
    data: cart,
  });
};

export const patchCartController = async (req, res) => {
  const reqData = {
    session_id: req.body.session_id,
    product_id: req.body.product_id,
    quantity: req.body.quantity,
  };

  const updatedCart = await updateCart(reqData, req.user);

  res.status(200).json({
    status: 200,
    message: 'Cart updated successfully',
    data: updatedCart,
  });
};

export const deleteCartItemController = async (req, res) => {
  const reqData = {
    session_id: req.body.session_id,
    product_id: req.body.product_id,
  };

  const updatedCart = await removeItemFromCart(reqData, req.user);

  res.status(200).json({
    status: 200,
    message: 'Product removed successfully',
    data: updatedCart,
  });
};

export const createOrderController = async (req, res) => {
  const reqData = {
    session_id: req.body.session_id,
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    delivery: req.body.delivery,
    details: req.body.details,
  };

  const order = await createOrder(reqData, req.user);

  res.status(201).json({ status: 201, data: order });
};
