import Joi from 'joi';

const categories = [
  'rolls',
  'sushi',
  'hotRolls',
  'hunkans',
  'sets',
  'drinks',
  'maki',
  'bigRolls',
  'other',
];

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  priceKiev: Joi.number().min(0).required(),
  priceKharkov: Joi.number().min(0).required(),
  category: Joi.string()
    .valid(...categories)
    .default('other'),
  description: Joi.string().allow('').max(1000),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  priceKiev: Joi.number().min(0),
  priceKharkov: Joi.number().min(0),
  category: Joi.string().valid(...categories),
  description: Joi.string().allow('').max(1000),
}).min(1);
