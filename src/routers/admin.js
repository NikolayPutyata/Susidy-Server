import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/authentication.js';
import { validateBody } from '../middlewares/validateBody.js';
import { upload } from '../middlewares/upload.js';
import { isValidId } from '../middlewares/isValidId.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  createProductController,
  deleteProductController,
  updateProductController,
  updateProductStopController,
} from '../controllers/products.js';
import {
  exportUsersController,
  getAllUsersController,
  searchUsersController,
  updateUserDiscountController,
} from '../controllers/users.js';
import {
  getOrdersByDayController,
  searchOrdersController,
} from '../controllers/orders.js';
import {
  createBannerController,
  deleteBannerController,
  getAllBannersController,
  updateBannerController,
} from '../controllers/banners.js';
import {
  createProductSchema,
  productStopSchema,
  updateProductSchema,
} from '../validation/products.js';
import { discountUpdateSchema } from '../validation/users.js';
import { createBannerSchema, updateBannerSchema } from '../validation/banners.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.post(
  '/products',
  upload.array('images', 10),
  validateBody(createProductSchema),
  ctrlWrapper(createProductController),
);

router.patch(
  '/products/:id',
  isValidId('id'),
  upload.array('images', 10),
  validateBody(updateProductSchema),
  ctrlWrapper(updateProductController),
);

router.patch(
  '/products/:id/stop',
  isValidId('id'),
  validateBody(productStopSchema),
  ctrlWrapper(updateProductStopController),
);

router.delete(
  '/products/:id',
  isValidId('id'),
  ctrlWrapper(deleteProductController),
);

router.get('/users', ctrlWrapper(getAllUsersController));

router.get('/users/search', ctrlWrapper(searchUsersController));

router.get('/users/export', ctrlWrapper(exportUsersController));

router.patch(
  '/users/:id/discount',
  isValidId('id'),
  validateBody(discountUpdateSchema),
  ctrlWrapper(updateUserDiscountController),
);

router.get('/orders/by-day', ctrlWrapper(getOrdersByDayController));

router.get('/orders/search', ctrlWrapper(searchOrdersController));

router.get('/banners', ctrlWrapper(getAllBannersController));

router.post(
  '/banners',
  upload.single('image'),
  validateBody(createBannerSchema),
  ctrlWrapper(createBannerController),
);

router.patch(
  '/banners/:id',
  isValidId('id'),
  upload.single('image'),
  validateBody(updateBannerSchema),
  ctrlWrapper(updateBannerController),
);

router.delete(
  '/banners/:id',
  isValidId('id'),
  ctrlWrapper(deleteBannerController),
);

export default router;
