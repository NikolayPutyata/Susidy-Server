import Joi from 'joi';

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
  delivery: Joi.string().allow(''),
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
