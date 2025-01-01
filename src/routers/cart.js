import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  addToCartController,
  createOrderController,
  getCartController,
  patchCartController,
  deleteCartItemController,
} from '../controllers/cart.js';
import { authentication } from '../middlewares/authentication.js';
import { validateBody } from '../middlewares/validateBody.js';
import {
  addToCartValidSchema,
  checkoutValidSchema,
  deleteCartItemValidSchema,
  updateCartValidSchema,
} from '../validation/cart.js';

const router = Router();

router.use(authentication);

router.get('/:cart_id', ctrlWrapper(getCartController));

router.post(
  '/add',
  validateBody(addToCartValidSchema),
  ctrlWrapper(addToCartController),
);

router.post(
  '/checkout',
  validateBody(checkoutValidSchema),
  ctrlWrapper(createOrderController),
);

router.patch(
  '/:cart_id',
  validateBody(updateCartValidSchema),
  ctrlWrapper(patchCartController),
);

router.delete(
  '/:cart_id',
  validateBody(deleteCartItemValidSchema),
  ctrlWrapper(deleteCartItemController),
);

export default router;
