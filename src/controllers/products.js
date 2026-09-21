import createHttpError from 'http-errors';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
} from '../services/products.js';
import { uploadImages } from '../utils/cloudinary.js';

export const getAllProductsController = async (req, res) => {
  const products = await getAllProducts();

  res.status(200).json({ status: 200, data: products });
};

export const getProductsByCategoryController = async (req, res) => {
  const { category } = req.params;

  const products = await getProductsByCategory(category);

  res.status(200).json({ status: 200, data: products });
};

export const getProductByIdController = async (req, res) => {
  const { productId } = req.params;
  const product = await getProductById(productId);

  res.status(200).json({ status: 200, data: product });
};

export const createProductController = async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    throw createHttpError(400, 'At least one product image is required');
  }

  const images = await uploadImages(files);

  const product = await createProduct({ ...req.body, images });

  res.status(201).json({ status: 201, data: product });
};

export const updateProductController = async (req, res) => {
  const { id } = req.params;
  const files = req.files || [];

  const payload = { ...req.body };
  if (files.length > 0) {
    payload.images = await uploadImages(files);
  }

  const product = await updateProduct(id, payload);

  res.status(200).json({ status: 200, data: product });
};

export const deleteProductController = async (req, res) => {
  const { id } = req.params;
  await deleteProduct(id);

  res.status(204).send();
};
