import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { sendOrderToTelegram } from '../utils/telegramSender.js';
import { findOrCreateUserByPhone } from './users.js';

const getCartCriteria = (user, session_id, extra = {}) => {
  if (user) {
    return { user_id: user._id, ...extra };
  }

  if (!session_id) {
    throw createHttpError(400, 'session_id is required for a guest cart');
  }

  return { session_id, ...extra };
};

export const getCart = async (cart_id, user, sessionId) => {
  const cart = await CartsCollection.findById(cart_id);

  if (!cart) {
    return [];
  }

  const isOwner = user
    ? cart.user_id === String(user._id)
    : !!sessionId && cart.session_id === sessionId;

  if (!isOwner) {
    return [];
  }

  return cart;
};

export const getMyCart = async (userId) => {
  const cart = await CartsCollection.findOne({ user_id: String(userId) });

  if (!cart) {
    return [];
  }

  return cart;
};

// Called right after a successful login: a guest may have added items to a
// session_id-scoped cart before signing in. From this point on, every cart
// operation looks the cart up by user_id instead, so without this the
// guest cart would just become invisible and unreachable.
export const mergeGuestCartIntoUser = async (sessionId, userId) => {
  if (!sessionId) return;

  const guestCart = await CartsCollection.findOne({ session_id: sessionId });
  if (!guestCart) return;

  if (guestCart.items.length === 0) {
    await CartsCollection.deleteOne({ _id: guestCart._id });
    return;
  }

  const userCart = await CartsCollection.findOne({ user_id: String(userId) });

  if (!userCart) {
    guestCart.user_id = String(userId);
    guestCart.session_id = undefined;
    await guestCart.save();
    return;
  }

  for (const item of guestCart.items) {
    const existing = userCart.items.find(
      (existingItem) => existingItem.product_id === item.product_id,
    );

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      userCart.items.push(item);
    }
  }

  await userCart.save();
  await CartsCollection.deleteOne({ _id: guestCart._id });
};

export const addToCart = async (
  { session_id, product_id, quantity, productName, price },
  user,
) => {
  const criteria = getCartCriteria(user, session_id, {
    'items.product_id': product_id,
  });

  let cart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $inc: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    const fallbackCriteria = getCartCriteria(user, session_id);
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
  const criteria = getCartCriteria(user, session_id, {
    'items.product_id': product_id,
  });

  const updatedCart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $set: { 'items.$.quantity': quantity } },
    { new: true },
  );

  return updatedCart;
};

export const removeItemFromCart = async ({ session_id, product_id }, user) => {
  const criteria = getCartCriteria(user, session_id);

  const updatedCart = await CartsCollection.findOneAndUpdate(
    criteria,
    { $pull: { items: { product_id } } },
    { new: true },
  );

  return updatedCart;
};

export const createOrder = async (
  { session_id, name, phoneNumber, delivery, details },
  user,
) => {
  const criteria = getCartCriteria(user, session_id);

  const cart = await CartsCollection.findOne(criteria);

  if (!cart || cart.items.length === 0) {
    throw createHttpError(404, 'Cart is empty');
  }

  const customer = user ?? (await findOrCreateUserByPhone({ name, phoneNumber }));

  const rawTotal = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const total =
    Math.round(rawTotal * (1 - customer.discount / 100) * 100) / 100;

  const order = await OrdersCollection.create({
    user_id: customer._id,
    session_id,
    name,
    phoneNumber,
    delivery,
    details,
    items: cart.items,
    total,
  });

  try {
    await sendOrderToTelegram(order);
  } catch (err) {
    console.error('Failed to send order notification to Telegram', err);
  }

  await CartsCollection.deleteOne(criteria);

  return order;
};
