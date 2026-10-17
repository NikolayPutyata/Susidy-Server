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

// Lowercase city here, unlike updateProfileSchema's 'Kyiv'/'Kharkiv' — this
// one feeds straight into checkout's own city values ('kyiv'/'kharkiv').
export const savedAddressSchema = Joi.object({
  city: Joi.string().valid('kyiv', 'kharkiv').required(),
  street: Joi.string().required(),
  building: Joi.string().allow(''),
  apartment: Joi.string().allow(''),
  entrance: Joi.string().allow(''),
  floor: Joi.string().allow(''),
  isPrivateHouse: Joi.boolean(),
  lat: Joi.number(),
  lng: Joi.number(),
  formattedAddress: Joi.string().allow(''),
  isDefault: Joi.boolean(),
});
