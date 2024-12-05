import { ProductsCollection } from '../db/models/products.js';

export const getAllProducts = async () => {
  const products = await ProductsCollection.find();
  return products;
};

export const getProductsByCategory = async (category) => {
  const products = await ProductsCollection.find({ category });
  return products;
};

export const getProductById = async (productId) => {
  const product = await ProductsCollection.findById(productId);
  return product;
};

// тимчасово
export const createProduct = async (payload) => {
  const product = await ProductsCollection.create(payload);
  return product;
};
//
