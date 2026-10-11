import Joi from 'joi';

export const discountUpdateSchema = Joi.object({
  discount: Joi.number().min(0).max(100).required(),
});

export const birthdayUpdateSchema = Joi.object({
  birthday: Joi.date().max('now').required(),
});
