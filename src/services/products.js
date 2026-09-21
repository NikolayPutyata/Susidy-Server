import createHttpError from 'http-errors';
import { ProductsCollection } from '../db/models/products.js';

export const getAllProducts = async () => {
  return await ProductsCollection.find();
};

export const getProductsByCategory = async (category) => {
  return await ProductsCollection.find({ category });
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

export const deleteProduct = async (productId) => {
  const product = await ProductsCollection.findByIdAndDelete(productId);

  if (!product) {
    throw createHttpError(404, 'Product not found');
  }

  return product;
};
