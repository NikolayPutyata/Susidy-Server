import { Router } from 'express';
import { validateBody } from '../middlewares/validateBody.js';
import {
  loginUserSchema,
  registerUserSchema,
  requestSmsCodeSchema,
  resetPasswordSchema,
} from '../validation/auth.js';
import {
  birthdayUpdateSchema,
  savedAddressSchema,
  updateProfileSchema,
} from '../validation/users.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';
import { requireAuth } from '../middlewares/authentication.js';
import { isValidId } from '../middlewares/isValidId.js';
import {
  getMeController,
  loginUserController,
  logoutUserController,
  refreshUserSessionController,
  registerUserController,
  requestSmsCodeController,
  resetPasswordController,
} from '../controllers/auth.js';
import {
  addMyFavoriteController,
  addMySavedAddressController,
  removeMyFavoriteController,
  removeMySavedAddressController,
  setMyDefaultSavedAddressController,
  updateMyBirthdayController,
  updateMyProfileController,
} from '../controllers/users.js';

const router = Router();

router.get('/me', requireAuth, ctrlWrapper(getMeController));

router.patch(
  '/me',
  requireAuth,
  validateBody(updateProfileSchema),
  ctrlWrapper(updateMyProfileController),
);

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
  '/me/addresses',
  requireAuth,
  validateBody(savedAddressSchema),
  ctrlWrapper(addMySavedAddressController),
);

router.delete(
  '/me/addresses/:addressId',
  requireAuth,
  isValidId('addressId'),
  ctrlWrapper(removeMySavedAddressController),
);

router.patch(
  '/me/addresses/:addressId/default',
  requireAuth,
  isValidId('addressId'),
  ctrlWrapper(setMyDefaultSavedAddressController),
);

router.post(
  '/sms/send',
  validateBody(requestSmsCodeSchema),
  ctrlWrapper(requestSmsCodeController),
);

router.post(
  '/password/reset',
  validateBody(resetPasswordSchema),
  ctrlWrapper(resetPasswordController),
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
