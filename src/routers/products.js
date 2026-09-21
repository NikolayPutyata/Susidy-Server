import { Router } from 'express';
import {
  getAllProductsController,
  getProductByIdController,
  getProductsByCategoryController,
} from '../controllers/products.js';
import { isValidProductId } from '../middlewares/isValidProductId.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const router = Router();

router.get('/all', ctrlWrapper(getAllProductsController));

router.get(
  '/category/:category',
  ctrlWrapper(getProductsByCategoryController),
);

router.get(
  '/:productId',
  isValidProductId,
  ctrlWrapper(getProductByIdController),
);

export default router;
