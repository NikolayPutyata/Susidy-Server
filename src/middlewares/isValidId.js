import { isValidObjectId } from 'mongoose';
import createHttpError from 'http-errors';

export const isValidId = (paramName) => (req, res, next) => {
  if (!isValidObjectId(req.params[paramName])) {
    throw createHttpError(400, 'ID is not valid');
  }

  next();
};
