import { Router } from 'express';
import { validateBody } from '../middlewares/validateBody.js';
import { loginUserSchema, registerUserSchema } from '../validation/auth.js';
import { birthdayUpdateSchema } from '../validation/users.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { requireAuth } from '../middlewares/authentication.js';
import { isValidId } from '../middlewares/isValidId.js';
import {
  getMeController,
  loginUserController,
  logoutUserController,
  refreshUserSessionController,
  registerUserController,
} from '../controllers/auth.js';
import {
  addMyFavoriteController,
  removeMyFavoriteController,
  updateMyBirthdayController,
} from '../controllers/users.js';

const router = Router();

router.get('/me', requireAuth, ctrlWrapper(getMeController));

router.patch(
  '/me/birthday',
  requireAuth,
  validateBody(birthdayUpdateSchema),
  ctrlWrapper(updateMyBirthdayController),
);

router.post(
  '/me/favorites/:productId',
  requireAuth,
  isValidId('productId'),
  ctrlWrapper(addMyFavoriteController),
);

router.delete(
  '/me/favorites/:productId',
  requireAuth,
  isValidId('productId'),
  ctrlWrapper(removeMyFavoriteController),
);

router.post(
  '/register',
  validateBody(registerUserSchema),
  ctrlWrapper(registerUserController),
);

router.post(
  '/login',
  validateBody(loginUserSchema),
  ctrlWrapper(loginUserController),
);

router.post('/logout', ctrlWrapper(logoutUserController));

router.post('/refresh', ctrlWrapper(refreshUserSessionController));

export default router;
