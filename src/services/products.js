import createHttpError from 'http-errors';
import { ProductsCollection } from '../db/models/products.js';

export const getAllProducts = async () => {
  return await ProductsCollection.find();
};

export const getProductsByCategory = async (category) => {
  return await ProductsCollection.find({ category });
};

export const getFeaturedProducts = async () => {
  return await ProductsCollection.find({ featured: true }).sort({
    featuredOrder: 1,
  });
};

export const getChefsPickProducts = async () => {
  return await ProductsCollection.find({ chefsPick: true }).sort({
    chefsPickOrder: 1,
  });
};

export const getProductById = async (productId) => {
  const product = await ProductsCollection.findById(productId);

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  return product;
};

export const createProduct = async (payload) => {
  return await ProductsCollection.create(payload);
};

export const updateProduct = async (productId, payload) => {
  const product = await ProductsCollection.findByIdAndUpdate(
    productId,
    payload,
    { new: true },
  );

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  return product;
};

export const setProductStopStatus = async (productId, pickupPointId, stopped) => {
  const update = stopped
    ? { $addToSet: { stoppedPoints: pickupPointId } }
    : { $pull: { stoppedPoints: pickupPointId } };

  const product = await ProductsCollection.findByIdAndUpdate(productId, update, {
    new: true,
  });

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  return product;
};

export const deleteProduct = async (productId) => {
  const product = await ProductsCollection.findByIdAndDelete(productId);

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  return product;
};
