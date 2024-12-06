import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { sendOrderToTelegram } from '../utils/telegramSender.js';

export const getCart = async (session_id) => {
  const cart = await CartsCollection.findOne({ session_id });
  if (!cart) {
    return [];
  }
  return cart;
};

export const addToCart = async ({
  session_id,
  product_id,
  quantity,
  productName,
  price,
}) => {
  let cart = await CartsCollection.findOneAndUpdate(
    { session_id, 'items.product_id': product_id },
    { $inc: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    cart = await CartsCollection.findOneAndUpdate(
      { session_id },
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

export const updateCart = async ({ session_id, product_id, quantity }) => {
  const updatedCart = await CartsCollection.findOneAndUpdate(
    { session_id, 'items.product_id': product_id },
    { $set: { 'items.$.quantity': quantity } },
    { new: true },
  );

  return updatedCart;
};

export const removeItemFromCart = async ({ session_id, product_id }) => {
  const updatedCart = await CartsCollection.findOneAndUpdate(
    { session_id },
    { $pull: { items: { product_id } } },
    { new: true },
  );

  return updatedCart;
};

export const createOrder = async ({ session_id, name, phoneNumber }) => {
  const cart = await CartsCollection.findOne({ session_id });

  if (!cart) {
    throw createHttpError(404, 'Cart not found!');
  }

  const order = await OrdersCollection.create({
    session_id,
    name,
    phoneNumber,
    items: cart.items,
    total: cart.items.length,
  });

  const tgMessage = await sendOrderToTelegram(order);

  await CartsCollection.deleteOne({ session_id });

  return tgMessage;
};
