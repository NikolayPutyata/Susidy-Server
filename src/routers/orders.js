import { Router } from 'express';
import { requireAuth } from '../middlewares/authentication.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { getMyOrdersController } from '../controllers/orders.js';

const router = Router();

router.get('/me', requireAuth, ctrlWrapper(getMyOrdersController));

export default router;
