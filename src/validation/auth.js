import Joi from 'joi';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  phoneNumber: Joi.string(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  city: Joi.string().valid('Kyiv', 'Kharkiv').required(),
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});