import Joi from 'joi';

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  password: Joi.string().required(),
  // '' — місто не обов'язкове; контрольований <select> завжди шле якесь
  // значення, і без цього порожній вибір падав як невалідний.
  city: Joi.string().valid('Kyiv', 'Kharkiv', ''),
});

export const loginUserSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  password: Joi.string().required(),
});
