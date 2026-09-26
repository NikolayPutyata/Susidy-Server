import {
  addToCart,
  createOrder,
  getMyCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.js';

export const getMyCartController = async (req, res) => {
  const cart = await getMyCart(req.user._id);

  res.status(200).json({ status: 200, data: cart });
};

export const addToCartController = async (req, res) => {
  const reqData = {
    product_id: req.body.product_id,
    quantity: req.body.quantity,
    productName: req.body.productName,
    price: req.body.price,
    image: req.body.image,
  };

  const cart = await addToCart(reqData, req.user._id);

  res.status(200).json({ status: 200, data: cart });
};

export const patchCartItemController = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const updatedCart = await updateCartItem(productId, quantity, req.user._id);

  res.status(200).json({
    status: 200,
    message: 'Cart updated successfully',
    data: updatedCart,
  });
};

export const deleteCartItemController = async (req, res) => {
  const { productId } = req.params;

  const updatedCart = await removeCartItem(productId, req.user._id);

  res.status(200).json({
    status: 200,
    message: 'Product removed successfully',
    data: updatedCart,
  });
};

export const createOrderController = async (req, res) => {
  const reqData = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    delivery: req.body.delivery,
    details: req.body.details,
    noCallback: req.body.noCallback,
    paymentMethod: req.body.paymentMethod,
    items: req.body.items,
  };

  const order = await createOrder(reqData, req.user);

  res.status(201).json({ status: 201, data: order });
};
