import Joi from 'joi';

const timeSlotPattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const addToCartValidSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  productName: Joi.string().min(1).required(),
  price: Joi.number().required(),
  image: Joi.string().allow('', null),
});

const checkoutItemSchema = Joi.object({
  product_id: Joi.string().required(),
  productName: Joi.string().min(1).required(),
  quantity: Joi.number().min(1).required(),
  price: Joi.number().required(),
  image: Joi.string().allow('', null),
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
  isPrivateHouse: Joi.boolean(),
  pickupAddress: Joi.string().allow(''),
  pickupPointId: Joi.string().allow(''),
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
  // required for guests; ignored for logged-in users (their cart in the
  // carts collection is the source of truth) — enforced in the service,
  // not here, since Joi doesn't see req.user.
  items: Joi.array().items(checkoutItemSchema),
});

export const updateCartItemValidSchema = Joi.object({
  quantity: Joi.number().min(1).required(),
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
