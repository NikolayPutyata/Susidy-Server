import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import {
  addToCartController,
  createOrderController,
  getCartController,
} from '../controllers/cart.js';

const router = Router();

router.get('/:session_id', ctrlWrapper(getCartController));

router.post('/add', ctrlWrapper(addToCartController));

router.post('/checkout', ctrlWrapper(createOrderController));

export default router;
