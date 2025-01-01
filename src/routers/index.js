import { Router } from 'express';
import productsRouter from './products.js';
import cartRouter from './cart.js';
import authRouter from './auth.js';

const router = Router();

router.use('/products', productsRouter);
router.use('/cart', cartRouter);
router.use('/auth', authRouter);

export default router;
