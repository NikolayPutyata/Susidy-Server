import Joi from 'joi';
import { PICKUP_POINT_IDS } from '../constants/index.js';

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
  // The admin form's weight input has no `required`, so it's left at the
  // form's default '' for any item without one (drinks, sets sold by
  // piece) — .empty('') treats that as "field not sent" instead of
  // trying (and failing) to parse '' as a number.
  weight: Joi.number().min(0).empty(''),
  composition: Joi.string().allow('').max(1000),
  allergens: Joi.string().allow('').max(500),
  posterProductId: Joi.string().allow('').max(50),
  featured: Joi.boolean(),
  featuredOrder: Joi.number().empty(''),
  chefsPick: Joi.boolean(),
  chefsPickOrder: Joi.number().empty(''),
  proteins: Joi.number().min(0).empty(''),
  fats: Joi.number().min(0).empty(''),
  carbs: Joi.number().min(0).empty(''),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  priceKiev: Joi.number().min(0),
  priceKharkov: Joi.number().min(0),
  category: Joi.string().valid(...categories),
  description: Joi.string().allow('').max(1000),
  weight: Joi.number().min(0).empty(''),
  composition: Joi.string().allow('').max(1000),
  allergens: Joi.string().allow('').max(500),
  posterProductId: Joi.string().allow('').max(50),
  featured: Joi.boolean(),
  featuredOrder: Joi.number().empty(''),
  chefsPick: Joi.boolean(),
  chefsPickOrder: Joi.number().empty(''),
  proteins: Joi.number().min(0).empty(''),
  fats: Joi.number().min(0).empty(''),
  carbs: Joi.number().min(0).empty(''),
}).min(1);

export const productStopSchema = Joi.object({
  pickupPointId: Joi.string()
    .valid(...PICKUP_POINT_IDS)
    .required(),
  stopped: Joi.boolean().required(),
});
