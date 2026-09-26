import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  addToCartController,
  createOrderController,
  getMyCartController,
  patchCartItemController,
  deleteCartItemController,
} from '../controllers/cart.js';
import { authentication, requireAuth } from '../middlewares/authentication.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  addToCartValidSchema,
  checkoutValidSchema,
  updateCartItemValidSchema,
} from '../validation/cart.js';

const router = Router();

// Guests never have a server-side cart (it lives in their browser's
// localStorage) — only checkout is reachable without an account.
router.get('/me', requireAuth, ctrlWrapper(getMyCartController));

router.post(
  '/add',
  requireAuth,
  validateBody(addToCartValidSchema),
  ctrlWrapper(addToCartController),
);

router.patch(
  '/items/:productId',
  requireAuth,
  validateBody(updateCartItemValidSchema),
  ctrlWrapper(patchCartItemController),
);

router.delete(
  '/items/:productId',
  requireAuth,
  ctrlWrapper(deleteCartItemController),
);

router.post(
  '/checkout',
  authentication,
  validateBody(checkoutValidSchema),
  ctrlWrapper(createOrderController),
);

export default router;
