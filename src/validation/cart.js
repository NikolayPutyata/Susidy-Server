import Joi from 'joi';

export const addToCartValidSchema = Joi.object({
  session_id: Joi.string(),
  product_id: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  productName: Joi.string().min(3).required(),
  price: Joi.number().required(),
});

export const checkoutValidSchema = Joi.object({
  session_id: Joi.string(),
  name: Joi.string().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
});

export const updateCartValidSchema = Joi.object({
  session_id: Joi.string(),
  product_id: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
});

export const deleteCartItemValidSchema = Joi.object({
  session_id: Joi.string(),
  product_id: Joi.string().required(),
});
