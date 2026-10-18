import { Router } from 'express';
import { getActiveBannersController } from '../controllers/banners.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const router = Router();

router.get('/', ctrlWrapper(getActiveBannersController));

export default router;
