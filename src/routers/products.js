import { Router } from 'express';
import {
  createProductController,
  getAllProductsController,
  getProductByIdController,
  getProductsByCategoryController,
} from '../controllers/products.js';
import { isValidProductId } from '../middlewares/isValidProductId.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const router = Router();

router.get('/all', ctrlWrapper(getAllProductsController));

// тимчасово
router.post('/all', ctrlWrapper(createProductController));
//

router.get(
  '/:productId',
  isValidProductId,
  ctrlWrapper(getProductByIdController),
);

router.get('/all/category', ctrlWrapper(getProductsByCategoryController));

export default router;
