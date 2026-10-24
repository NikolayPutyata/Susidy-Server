import Joi from 'joi';

const timeSlotPattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

const addonTypeSchema = Joi.string()
  .valid('sauce', 'ginger', 'wasabi')
  .allow(null);

export const addToCartValidSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  productName: Joi.string().min(1).required(),
  price: Joi.number().required(),
  image: Joi.string().allow('', null),
  weight: Joi.number().min(0).allow(null),
  addonType: addonTypeSchema,
  category: Joi.string().allow('', null),
  // Used only if this add ends up granting a NEW free sauce/ginger/wasabi
  // line (see utils/addons.js::recomputeAddons) — picks the right city's
  // price for it. Optional; without it a freshly auto-created line just
  // waits for the next city-triggered reprice to get the correct price.
  city: Joi.string().valid('kyiv', 'kharkiv'),
});

const checkoutItemSchema = Joi.object({
  product_id: Joi.string().required(),
  productName: Joi.string().min(1).required(),
  quantity: Joi.number().min(1).required(),
  price: Joi.number().required(),
  image: Joi.string().allow('', null),
  weight: Joi.number().min(0).allow(null),
  addonType: addonTypeSchema,
  category: Joi.string().allow('', null),
  freeQuantity: Joi.number().min(0),
});

export const checkoutValidSchema = Joi.object({
  name: Joi.string().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  city: Joi.string().valid('kyiv', 'kharkiv').required(),
  fulfillment: Joi.string().valid('pickup', 'delivery').required(),
  street: Joi.string().allow(''),
  building: Joi.string().allow(''),
  apartment: Joi.string().allow(''),
  entrance: Joi.string().allow(''),
  floor: Joi.string().allow(''),
  // The address picker's own tracked display value — duplicates `street`
  // in practice (both hold the full formatted address), kept separate on
  // the client only to drive the input's controlled value. Accepted here,
  // not stored on the order.
  formattedAddress: Joi.string().allow(''),
  isPrivateHouse: Joi.boolean(),
  pickupAddress: Joi.string().allow(''),
  pickupPointId: Joi.string().allow(''),
  // Optional: the geocoded delivery address picked via autocomplete or the
  // map. When present, the service recomputes the nearest serving point
  // from these itself — pickupPointId above is never trusted directly for
  // a delivery order, only set by the client for pickup.
  // The client's initial form state is `null` (not omitted) until a
  // delivery address is picked, and sends that literal null for pickup
  // orders too — Joi.number() alone treats a present null as "not a
  // number", not as "absent", and rejects it.
  deliveryLat: Joi.number().allow(null),
  deliveryLng: Joi.number().allow(null),
  // 'asap' is only meaningful for delivery — pickup always needs a real slot
  // since staff must have the order ready by the time the customer arrives.
  requestedTime: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (value === 'asap') {
        if (helpers.state.ancestors[0].fulfillment === 'pickup') {
          return helpers.error('any.invalid');
        }
        return value;
      }
      if (!timeSlotPattern.test(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  cutlery: Joi.number().integer().min(1).max(20),
  details: Joi.string().allow(''),
  noCallback: Joi.boolean(),
  paymentMethod: Joi.string().valid('cod', 'online'),
  // The amount the customer will pay with in cash, for staff to prepare
  // change — only meaningful for paymentMethod 'cod', ignored otherwise
  // (checked against the final total in the service, not here, since
  // the total isn't known until items/discount/delivery fee are resolved).
  cashAmount: Joi.number().min(0).empty('').allow(null),
  // required for guests; ignored for logged-in users (their cart in the
  // carts collection is the source of truth) — enforced in the service,
  // not here, since Joi doesn't see req.user.
  items: Joi.array().items(checkoutItemSchema),
});

export const updateCartItemValidSchema = Joi.object({
  quantity: Joi.number().min(1).required(),
  city: Joi.string().valid('kyiv', 'kharkiv'),
});

export const repriceCartValidSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().required(),
        price: Joi.number().required(),
      }),
    )
    .min(1)
    .required(),
});
