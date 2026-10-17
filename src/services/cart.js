import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { ProductsCollection } from '../db/models/products.js';
import { sendOrderToTelegram } from '../utils/telegramSender.js';
import { findOrCreateUserByPhone } from './users.js';
import { findServingPoint } from './locations.js';

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

// Викликається клієнтом при зміні міста — товари в кошику вже додані за
// ціною попереднього міста, і мають бути перераховані під нове.
export const repriceCart = async (items, userId) => {
  const cart = await CartsCollection.findOne({ user_id: String(userId) });

  if (!cart) {
    return [];
  }

  const priceByProductId = new Map(
    items.map(({ product_id, price }) => [product_id, price]),
  );

  for (const item of cart.items) {
    if (priceByProductId.has(item.product_id)) {
      item.price = priceByProductId.get(item.product_id);
    }
  }

  await cart.save();

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
  {
    name,
    phoneNumber,
    city,
    fulfillment,
    street,
    building,
    apartment,
    entrance,
    floor,
    isPrivateHouse,
    pickupAddress,
    pickupPointId,
    deliveryLat,
    deliveryLng,
    requestedTime,
    cutlery,
    details,
    noCallback,
    paymentMethod,
    items,
  },
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

  // For pickup, the customer picked the point themselves — trust it as-is.
  // For delivery, pickupPointId means "which point will prepare this" and
  // is never taken from the client: it's recomputed here from the geocoded
  // address, the same way resolveBot's Telegram routing can't trust a
  // client-claimed point either. No coordinates yet (feature not used, or
  // that city has no geocoded points) just leaves it undetermined, same as
  // before this field existed.
  const hasDeliveryLocation =
    fulfillment === 'delivery' &&
    typeof deliveryLat === 'number' &&
    typeof deliveryLng === 'number';

  const resolvedPickupPointId =
    fulfillment === 'pickup'
      ? pickupPointId
      : hasDeliveryLocation
        ? findServingPoint({ lat: deliveryLat, lng: deliveryLng, city })?.pointId
        : undefined;

  // An admin can "stop" a position at one specific point while it stays
  // available everywhere else — applies once we know which point is
  // actually preparing the order, pickup or delivery alike.
  if (resolvedPickupPointId) {
    const stoppedProducts = await ProductsCollection.find({
      _id: { $in: orderItems.map((item) => item.product_id) },
      stoppedPoints: resolvedPickupPointId,
    });

    if (stoppedProducts.length > 0) {
      const names = stoppedProducts.map((p) => p.name).join(', ');
      throw createHttpError(
        409,
        `На жаль, цих позицій тимчасово немає на обраній точці: ${names}`,
      );
    }
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
    city,
    fulfillment,
    street,
    building,
    apartment,
    entrance,
    floor,
    isPrivateHouse,
    pickupAddress,
    pickupPointId: resolvedPickupPointId,
    deliveryLocation: hasDeliveryLocation
      ? { lat: deliveryLat, lng: deliveryLng }
      : undefined,
    requestedTime,
    cutlery,
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
