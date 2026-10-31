import Joi from 'joi';

const phoneNumberSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .required();

// The 6-digit code from the SMS (services/sms.js).
const smsCodeSchema = Joi.string()
  .pattern(/^[0-9]{6}$/)
  .required();

export const requestSmsCodeSchema = Joi.object({
  phoneNumber: phoneNumberSchema,
  purpose: Joi.string().valid('register', 'reset').required(),
});

export const resetPasswordSchema = Joi.object({
  phoneNumber: phoneNumberSchema,
  code: smsCodeSchema,
  password: Joi.string().required(),
});

export const registerUserSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  password: Joi.string().required(),
  // '' — місто не обов'язкове; контрольований <select> завжди шле якесь
  // значення, і без цього порожній вибір падав як невалідний.
  city: Joi.string().valid('Kyiv', 'Kharkiv', ''),
  code: smsCodeSchema,
});

export const loginUserSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  password: Joi.string().required(),
});
