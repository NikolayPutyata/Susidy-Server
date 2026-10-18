import Joi from 'joi';

export const createBannerSchema = Joi.object({
  title: Joi.string().allow('').max(200),
  subtitle: Joi.string().allow('').max(300),
  link: Joi.string().allow('').max(500),
  order: Joi.number().empty(''),
  active: Joi.boolean(),
});

export const updateBannerSchema = Joi.object({
  title: Joi.string().allow('').max(200),
  subtitle: Joi.string().allow('').max(300),
  link: Joi.string().allow('').max(500),
  order: Joi.number().empty(''),
  active: Joi.boolean(),
}).min(1);
