import { Router } from 'express';
import productsRouter from './products.js';
import cartRouter from './cart.js';
import authRouter from './auth.js';
import adminRouter from './admin.js';
import ordersRouter from './orders.js';
import locationsRouter from './locations.js';
import bannersRouter from './banners.js';

const router = Router();

router.use('/products', productsRouter);
router.use('/cart', cartRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/orders', ordersRouter);
router.use('/locations', locationsRouter);
router.use('/banners', bannersRouter);

export default router;
