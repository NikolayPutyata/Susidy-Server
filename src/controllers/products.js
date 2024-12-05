import {
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
} from '../services/products.js';

export const getAllProductsController = async (req, res) => {
  const products = await getAllProducts();

  res.status(200).json({ status: 200, data: products });
};

export const getProductsByCategoryController = async (req, res) => {
  const { category } = req.body;

  const products = await getProductsByCategory(category);

  res.status(200).json({ status: 200, data: products });
};

export const getProductByIdController = async (req, res) => {
  const { productId } = req.params;
  const product = await getProductById(productId);

  res.status(200).json({ status: 200, data: product });
};

// тимчасово
export const createProductController = async (req, res) => {
  const product = await createProduct(req.body);

  res.status(200).json({ status: 200, data: product });
};
//
