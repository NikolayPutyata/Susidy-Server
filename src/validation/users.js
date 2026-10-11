import Joi from 'joi';

export const discountUpdateSchema = Joi.object({
  discount: Joi.number().min(0).max(100).required(),
});

export const birthdayUpdateSchema = Joi.object({
  birthday: Joi.date().max('now').required(),
});

// Same casing as registerUserSchema's city ('Kyiv'/'Kharkiv') — this is
// the user's own profile field, kept consistent with how it's set at
// registration, separate from the lowercase city used for cart pricing.
export const updateProfileSchema = Joi.object({
  name: Joi.string().min(3).max(30),
  city: Joi.string().valid('Kyiv', 'Kharkiv', ''),
}).min(1);
