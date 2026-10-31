import createHttpError from 'http-errors';
import { CartsCollection } from '../db/models/carts.js';
import { OrdersCollection } from '../db/models/orders.js';
import { ProductsCollection } from '../db/models/products.js';
import {
  sendOrderToOwnerTelegram,
  sendOrderToTelegram,
} from '../utils/telegramSender.js';
import { sendOrderToPoster } from '../utils/posterSender.js';
import { findOrCreateUserByPhone } from './users.js';
import { findServingPoint } from './locations.js';
import { saveBackupContact } from '../db/backupContacts.js';
import { getChargeableQuantity, loadAddonCatalogForCity, recomputeAddons } from '../utils/addons.js';

export const getMyCart = async (userId) => {
  const cart = await CartsCollection.findOne({ user_id: String(userId) });

  if (!cart) {
    return [];
  }

  return cart;
};

export const addToCart = async (
  { product_id, quantity, productName, price, image, weight, addonType, category, city },
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
      {
        $push: {
          items: { product_id, quantity, productName, price, image, weight, addonType, category },
        },
      },
      { new: true, upsert: true },
    );
  }

  // Adding/incrementing is never a removal, so recomputing here can only
  // ever grant or top up free addon lines — never resurrects a deliberate
  // removal (see utils/addons.js).
  const addonCatalog = await loadAddonCatalogForCity(city);
  cart.items = recomputeAddons(cart.items, addonCatalog);
  await cart.save();

  return cart;
};

export const updateCartItem = async (productId, quantity, userId, city) => {
  const cart = await CartsCollection.findOneAndUpdate(
    { user_id: String(userId), 'items.product_id': productId },
    { $set: { 'items.$.quantity': quantity } },
    { new: true },
  );

  if (!cart) {
    throw createHttpError(404, 'Item not found in cart');
  }

  // Same reasoning as addToCart — a quantity SET (never a full removal)
  // is always safe to recompute from.
  const addonCatalog = await loadAddonCatalogForCity(city);
  cart.items = recomputeAddons(cart.items, addonCatalog);
  await cart.save();

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

export const removeCartItem = async (productId, userId, city) => {
  const cartBefore = await CartsCollection.findOne({ user_id: String(userId) });
  const removedItem = cartBefore?.items.find((item) => item.product_id === productId);

  const cart = await CartsCollection.findOneAndUpdate(
    { user_id: String(userId) },
    { $pull: { items: { product_id: productId } } },
    { new: true },
  );

  if (!cart) {
    throw createHttpError(404, 'Cart not found');
  }

  // Only a MAIN item's removal should shrink/clear its linked addons — a
  // deliberate removal of an addon line itself (e.g. the customer doesn't
  // want sauce at all) must stick, not get silently re-granted by the
  // next unrelated recompute (see utils/addons.js).
  if (removedItem && !removedItem.addonType) {
    const addonCatalog = await loadAddonCatalogForCity(city);
    cart.items = recomputeAddons(cart.items, addonCatalog);
    await cart.save();
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
    trainingChopsticks,
    details,
    noCallback,
    paymentMethod,
    cashAmount,
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

  // Free sauce/ginger/wasabi units never get charged — only the quantity
  // beyond each line's own free allowance does (see utils/addons.js).
  const rawTotal = orderItems.reduce(
    (sum, item) => sum + getChargeableQuantity(item) * item.price,
    0,
  );
  const itemsTotal =
    Math.round(rawTotal * (1 - customer.discount / 100) * 100) / 100;

  // Free-delivery threshold is based on the full chargeable order value —
  // paid sauce/ginger/wasabi counts too (the customer is genuinely paying
  // for it), while free addon units still don't inflate it, since
  // itemsTotal above already excludes them via getChargeableQuantity.
  // Pickup never gets a delivery fee regardless of this sum.
  const FREE_DELIVERY_THRESHOLD = 700;
  const DELIVERY_FEE = 150;
  const deliveryFee =
    fulfillment === 'delivery' && itemsTotal < FREE_DELIVERY_THRESHOLD
      ? DELIVERY_FEE
      : 0;

  const total = itemsTotal + deliveryFee;

  // Defensive server-side check mirroring the client's own validation —
  // never trust a client-supplied cash amount that wouldn't actually
  // cover the order, and it's only meaningful for cash-on-delivery.
  if (paymentMethod === 'cod' && typeof cashAmount === 'number' && cashAmount < total) {
    throw createHttpError(
      400,
      `Сума готівки менша за суму замовлення (${total} ₴)`,
    );
  }

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
    trainingChopsticks,
    details,
    // "Don't call me back" is only honoured for registered users whose
    // phone was confirmed by SMS — a guest's number is unverified, so staff
    // must be able to call it.
    noCallback: Boolean(user?.phoneVerified && noCallback),
    paymentMethod,
    cashAmount: paymentMethod === 'cod' ? cashAmount : undefined,
    items: orderItems,
    deliveryFee,
    total,
  });

  // Side effects of a placed order — independent of each other, so they run
  // in parallel, and none of them may fail the order itself.
  const sideEffects = [
    ['send order notification to Telegram', sendOrderToTelegram(order)],
    ["send order copy to the owner's Telegram", sendOrderToOwnerTelegram(order)],
    ['push order to Poster', sendOrderToPoster(order)],
    ['save contact to the backup DB', saveBackupContact({ name, phoneNumber })],
  ];
  const results = await Promise.allSettled(sideEffects.map(([, p]) => p));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Failed to ${sideEffects[i][0]}`, result.reason);
    }
  });

  if (user) {
    await CartsCollection.deleteOne({ user_id: String(user._id) });
  }

  return order;
};
