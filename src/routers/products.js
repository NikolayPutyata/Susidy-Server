import { Router } from 'express';
import {
  getAllProductsController,
  getChefsPickProductsController,
  getFeaturedProductsController,
  getProductByIdController,
  getProductsByCategoryController,
} from '../controllers/products.js';
import { isValidProductId } from '../middlewares/isValidProductId.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const router = Router();

router.get('/all', ctrlWrapper(getAllProductsController));

// Must come before /:productId — otherwise "featured"/"chefs-picks" would
// get routed there as an (invalid) product id.
router.get('/featured', ctrlWrapper(getFeaturedProductsController));
router.get('/chefs-picks', ctrlWrapper(getChefsPickProductsController));

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
