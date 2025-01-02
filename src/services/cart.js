import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { sendOrderToTelegram } from '../utils/telegramSender.js';

export const getCart = async (cart_id) => {
  const cart = await CartsCollection.findById(cart_id);

  if (!cart) {
    return [];
  }

  return cart;
};

export const addToCart = async (
  { session_id, product_id, quantity, productName, price },
  user,
) => {
  const criteria = user
    ? { user_id: user._id, 'items.product_id': product_id }
    : { session_id, 'items.product_id': product_id };

  let cart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $inc: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    const fallbackCriteria = user ? { user_id: user._id } : { session_id };
    cart = await CartsCollection.findOneAndUpdate(
      fallbackCriteria,
      {
        $push: {
          items: { product_id, quantity, productName, price },
        },
      },
      { new: true, upsert: true },
    );
  }

  return cart;
};

export const updateCart = async (
  { session_id, product_id, quantity },
  user,
) => {
  const criteria = user
    ? { user_id: user._id, 'items.product_id': product_id }
    : { session_id, 'items.product_id': product_id };

  const updatedCart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $set: { 'items.$.quantity': quantity } },
    { new: true },
  );

  return updatedCart;
};

export const removeItemFromCart = async ({ session_id, product_id }, user) => {
  const criteria = user ? { user_id: user._id } : { session_id };

  const updatedCart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $pull: { items: { product_id } } },
    { new: true },
  );

  return updatedCart;
};

export const createOrder = async ({ session_id, name, phoneNumber }, user) => {
  const criteria = user ? { user_id: user._id } : { session_id };

  const cart = await CartsCollection.findOne(criteria);

  if (!cart) {
    throw createHttpError(404, 'Cart not found!');
  }

  const order = await OrdersCollection.create({
    user_id: user ? user._id : null,
    session_id,
    name,
    phoneNumber,
    items: cart.items,
    total: cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    ),
  });

  const tgMessage = await sendOrderToTelegram(order);

  await CartsCollection.deleteOne(criteria);

  return tgMessage;
};
