import { Router } from 'express';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { getNearestPointController } from '../controllers/locations.js';

const router = Router();

router.get('/nearest', ctrlWrapper(getNearestPointController));

export default router;
