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
} from '../controllers/products.js';
import {
  getAllUsersController,
  searchUsersController,
  updateUserDiscountController,
} from '../controllers/users.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validation/products.js';
import { discountUpdateSchema } from '../validation/users.js';

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

router.delete(
  '/products/:id',
  isValidId('id'),
  ctrlWrapper(deleteProductController),
);

router.get('/users', ctrlWrapper(getAllUsersController));

router.get('/users/search', ctrlWrapper(searchUsersController));

router.patch(
  '/users/:id/discount',
  isValidId('id'),
  validateBody(discountUpdateSchema),
  ctrlWrapper(updateUserDiscountController),
);

export default router;
