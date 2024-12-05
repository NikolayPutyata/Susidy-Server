import { isValidObjectId } from 'mongoose';
import createHttpError from 'http-errors';

export const isValidProductId = (req, res, next) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) {
    throw createHttpError(400, 'ID is not valid');
  }

  next();
};
