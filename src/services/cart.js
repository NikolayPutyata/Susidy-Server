import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { sendOrderToTelegram } from '../utils/telegramSender.js';
import { findOrCreateUserByPhone } from './users.js';

export const getMyCart = async (userId) => {
  const cart = await CartsCollection.findOne({ user_id: String(userId) });

  if (!cart) {
    return [];
  }

  return cart;
};

export const addToCart = async (
  { product_id, quantity, productName, price, image },
  userId,
) => {
  let cart = await CartsCollection.findOneAndUpdate(
    { user_id: String(userId), 'items.product_id': product_id },
    { $inc: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    cart = await CartsCollection.findOneAndUpdate(
      { user_id: String(userId) },
      { $push: { items: { product_id, quantity, productName, price, image } } },
      { new: true, upsert: true },
    );
  }

  return cart;
};

export const updateCartItem = async (productId, quantity, userId) => {
  const cart = await CartsCollection.findOneAndUpdate(
    { user_id: String(userId), 'items.product_id': productId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    throw createHttpError(404, 'Item not found in cart');
  }

  return cart;
};

export const removeCartItem = async (productId, userId) => {
  const cart = await CartsCollection.findOneAndUpdate(
    { user_id: String(userId) },
    { $pull: { items: { product_id: productId } } },
    { new: true },
  );

  if (!cart) {
    throw createHttpError(404, 'Cart not found');
  }

  return cart;
};

export const createOrder = async (
  { name, phoneNumber, delivery, details, noCallback, paymentMethod, items },
  user,
) => {
  let orderItems;

  if (user) {
    const cart = await CartsCollection.findOne({ user_id: String(user._id) });

    if (!cart || cart.items.length === 0) {
      throw createHttpError(404, 'Cart is empty');
    }

    orderItems = cart.items;
  } else {
    if (!Array.isArray(items) || items.length === 0) {
      throw createHttpError(400, 'Cart is empty');
    }

    orderItems = items;
  }

  const customer = user ?? (await findOrCreateUserByPhone({ name, phoneNumber }));

  const rawTotal = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const total =
    Math.round(rawTotal * (1 - customer.discount / 100) * 100) / 100;

  const order = await OrdersCollection.create({
    user_id: customer._id,
    name,
    phoneNumber,
    delivery,
    details,
    noCallback,
    paymentMethod,
    items: orderItems,
    total,
  });

  try {
    await sendOrderToTelegram(order);
  } catch (err) {
    console.error('Failed to send order notification to Telegram', err);
  }

  if (user) {
    await CartsCollection.deleteOne({ user_id: String(user._id) });
  }

  return order;
};
